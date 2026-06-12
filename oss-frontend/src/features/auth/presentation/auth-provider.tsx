"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import type { SessionState } from "@/features/auth/domain/session";
import {
  InboundMessageType,
  OutboundMessageType,
  isNativeBridgeAvailable,
  postToNative,
  registerWebBridge,
  type InboundMessage,
} from "@/shared/lib/native-bridge";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * 인증/세션 전역 Provider.
 *
 * 책임:
 * - 네이티브 브릿지 인바운드 리스너를 등록한다(auth/세션 메시지 담당). 수신구(window.WebBridge)는
 *   브릿지가 단일 설치·fan-out하므로, 서브웹뷰의 BACK_PRESSED 등 다른 리스너와 공존한다.
 * - 로그인 상태를 BFF(/api/auth/session)와 동기화해 화면 전역에 공유한다.
 * - 비로그인 시 행위를 가로채 로그인을 유도하고(requireAuth), 성공 후 원래 행위를 복귀한다.
 * - (개발용) 송수신 브릿지 이벤트 로그를 노출해 테스트 하니스가 표시할 수 있게 한다.
 */

type AuthStatus = "loading" | "authenticated" | "anonymous";

type BridgeEventDirection = "in" | "out";

export type BridgeEvent = {
  id: number;
  direction: BridgeEventDirection;
  type: string;
  at: string;
  payload?: unknown;
};

export type RequireAuthOptions = {
  /** 로그인 유도 사유(분석/문구용). */
  reason?: string;
  /** true면 AUTH_LOGIN_MODAL(모달 즉시), 기본 false면 AUTH_LOGIN_PROMPT(안내 알럿). */
  direct?: boolean;
};

type AuthContextValue = {
  status: AuthStatus;
  events: BridgeEvent[];
  /** 네이티브 브릿지 연결 여부(웹 단독이면 false). */
  nativeAvailable: boolean;
  /**
   * 보호된 행위를 실행한다. 로그인 상태면 즉시 실행, 아니면 행위를 보관 후 로그인 유도.
   * - 기본: AUTH_LOGIN_PROMPT (안내 알럿 → 사용자가 동의해야 모달, 소프트 유도)
   * - options.direct=true: AUTH_LOGIN_MODAL (모달 즉시, 다이렉트)
   * 로그인 성공 시 보관한 행위가 자동 복귀된다.
   */
  requireAuth: (action: () => void, options?: RequireAuthOptions) => void;
  /** 서버 세션을 다시 읽어 상태를 갱신한다. */
  refresh: () => Promise<void>;
  /** 로그아웃: 서버 세션 제거 + 네이티브에 로그아웃 요청 통지. */
  logout: () => Promise<void>;
  /**
   * (개발용) 네이티브 없이 인바운드 메시지를 주입한다. 실제 수신구를 그대로 통과시켜
   * 운영 경로와 동일하게 동작한다.
   */
  simulateInbound: (message: InboundMessage) => void;
};

/** 이벤트 로그 최대 보관 개수(메모리 보호). */
const MAX_EVENT_LOG = 50;

const SESSION_ENDPOINT = "/api/auth/session";

const AuthContext = createContext<AuthContextValue | null>(null);

// 네이티브 브릿지 연결 여부는 클라이언트 전용(window) 외부 상태다.
// useSyncExternalStore로 읽어 SSR 하이드레이션 불일치와 effect 내 setState를 피한다.
const subscribeNoop = () => () => {};


async function fetchSessionState(
  init?: RequestInit,
): Promise<SessionState | null> {
  try {
    const response = await fetch(SESSION_ENDPOINT, init);
    const body = (await response.json()) as ApiSuccessResponse<SessionState>;

    return body.success ? body.data : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [events, setEvents] = useState<BridgeEvent[]>([]);
  const nativeAvailable = useSyncExternalStore(
    subscribeNoop,
    isNativeBridgeAvailable,
    () => false,
  );

  // 대기 중 행위와 이벤트 id는 렌더와 무관하므로 ref로 보관(전역 변수 대신 컴포넌트 스코프).
  const pendingActionRef = useRef<(() => void) | null>(null);
  const eventIdRef = useRef(0);

  const logEvent = useCallback(
    (direction: BridgeEventDirection, type: string, payload?: unknown) => {
      eventIdRef.current += 1;
      const entry: BridgeEvent = {
        id: eventIdRef.current,
        direction,
        type,
        at: new Date().toLocaleTimeString(),
        payload,
      };

      setEvents((prev) => [entry, ...prev].slice(0, MAX_EVENT_LOG));
    },
    [],
  );

  const applyState = useCallback((state: SessionState | null) => {
    setStatus(state?.authenticated ? "authenticated" : "anonymous");
  }, []);

  const refresh = useCallback(async () => {
    const state = await fetchSessionState({ method: "GET" });
    applyState(state);
  }, [applyState]);

  // 네이티브 토큰 → 서버 세션 수립
  const establishSession = useCallback(
    async (accessToken: string, expiresAt?: number) => {
      const state = await fetchSessionState({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, expiresAt }),
      });

      applyState(state);

      // 로그인 성공으로 세션이 수립됐다면 보관한 행위를 복귀한다.
      if (state?.authenticated && pendingActionRef.current) {
        const action = pendingActionRef.current;
        pendingActionRef.current = null;
        action();
      }
    },
    [applyState],
  );

  const clearSession = useCallback(async () => {
    pendingActionRef.current = null;
    await fetchSessionState({ method: "DELETE" });
    applyState({ authenticated: false });
  }, [applyState]);

  const handleInbound = useCallback(
    (message: InboundMessage) => {
      logEvent("in", message.type, "payload" in message ? message.payload : undefined);

      switch (message.type) {
        case InboundMessageType.AUTH_LOGIN_SUCCESS:
          void establishSession(
            message.payload.accessToken,
            message.payload.expiresAt,
          );
          return;
        case InboundMessageType.AUTH_LOGIN_CANCELLED:
          // 사용자가 로그인을 취소했으므로 대기 중 행위를 폐기한다.
          pendingActionRef.current = null;
          return;
        case InboundMessageType.AUTH_SESSION_EXPIRED:
        case InboundMessageType.AUTH_LOGOUT:
          void clearSession();
          return;
      }
    },
    [clearSession, establishSession, logEvent],
  );

  // 핸들러 최신값을 ref로 유지해 수신구는 마운트당 한 번만 등록한다.
  const handleInboundRef = useRef(handleInbound);
  useEffect(() => {
    handleInboundRef.current = handleInbound;
  });

  useEffect(() => {
    const unregister = registerWebBridge((message) =>
      handleInboundRef.current(message),
    );

    // 웹뷰가 수신 준비됐음을 알린다 → 네이티브가 기존 로그인 상태면 토큰을 재주입.
    logEvent("out", OutboundMessageType.WEBVIEW_READY);
    postToNative({ type: OutboundMessageType.WEBVIEW_READY });

    // 초기 세션 동기화. 상태 갱신은 비동기 콜백에서 수행한다(effect 본문 직접 setState 회피).
    void fetchSessionState({ method: "GET" }).then(applyState);

    return unregister;
  }, [applyState, logEvent]);

  const requestLogin = useCallback(
    (direct: boolean, reason?: string) => {
      const type = direct
        ? OutboundMessageType.AUTH_LOGIN_MODAL
        : OutboundMessageType.AUTH_LOGIN_PROMPT;
      const payload = reason ? { reason } : undefined;
      logEvent("out", type, payload);
      postToNative({ type, payload });
    },
    [logEvent],
  );

  const requireAuth = useCallback(
    (action: () => void, options?: RequireAuthOptions) => {
      if (status === "authenticated") {
        action();
        return;
      }

      // 로그인 후 복귀할 행위를 보관하고 네이티브에 로그인 유도(프롬프트/모달)를 요청한다.
      pendingActionRef.current = action;
      requestLogin(options?.direct ?? false, options?.reason);
    },
    [requestLogin, status],
  );

  const logout = useCallback(async () => {
    logEvent("out", OutboundMessageType.AUTH_LOGOUT_REQUEST);
    postToNative({ type: OutboundMessageType.AUTH_LOGOUT_REQUEST });
    await clearSession();
  }, [clearSession, logEvent]);

  const simulateInbound = useCallback((message: InboundMessage) => {
    if (typeof window === "undefined" || !window.WebBridge) {
      return;
    }

    // 실제 수신구를 그대로 통과시켜 운영 경로와 동일하게 처리한다.
    window.WebBridge.receive(JSON.stringify(message));
  }, []);

  const value: AuthContextValue = {
    status,
    events,
    nativeAvailable,
    requireAuth,
    refresh,
    logout,
    simulateInbound,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
