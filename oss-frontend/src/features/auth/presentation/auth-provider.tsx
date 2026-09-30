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
import { useSessionHint } from "@/features/auth/presentation/session-hint";
import {
  InboundMessageType,
  OutboundMessageType,
  isNativeBridgeAvailable,
  notifySessionRefreshed,
  notifySessionRefreshFailed,
  postToNative,
  registerWebBridge,
  type InboundMessage,
} from "@/shared/lib/native-bridge";
import type { ApiSuccessResponse } from "@/shared/types/api";
import { useOpenInAppPrompt } from "@/shared/ui";

/**
 * 인증/세션 전역 Provider.
 *
 * 책임:
 * - 네이티브 브릿지 인바운드 리스너를 등록한다(auth/세션 메시지 담당). 수신구(window.WebBridge)는
 *   브릿지가 단일 설치·fan-out하므로, 알럿·시트 결과 회신 등 다른 리스너와 공존한다.
 * - 로그인 상태를 BFF(/api/auth/session)와 동기화해 화면 전역에 공유한다.
 * - 비로그인 시 행위를 가로채 로그인을 유도하고(requireAuth), 성공 후 원래 행위를 복귀한다.
 *   복귀 없이 유도만 하는 경로(promptLogin)도 있다 — 좋아요·저장처럼 토글이라 자동 실행이 위험한 행위용.
 *   네이티브가 없는 외부 브라우저(공유 링크)에서는 "앱에서 계속하기" 안내로 대신한다.
 * - 비로그인 → 로그인 전환을 loginCount로 알린다 — 화면이 viewer 상태(좋아요·소유자 등)를 다시 읽는 신호.
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
  /**
   * 로그인 유도만 하고 로그인 성공 후 아무것도 실행하지 않는다.
   * 좋아요·저장 API는 토글이라(있으면 삭제) 자동 실행하면 이미 눌렀던 글이 취소될 수 있다(#173).
   */
  promptLogin: (options?: RequireAuthOptions) => void;
  /**
   * 비로그인 → 로그인으로 바뀐 횟수. 값이 바뀌면 화면이 viewer 상태를 다시 읽어야 한다(useOnLogin).
   * 토큰 갱신(로그인 상태에서 재주입)이나 최초 세션 판정은 세지 않는다 — 화면이 이미 그 상태로 그려져 있다.
   */
  loginCount: number;
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
  const [loginCount, setLoginCount] = useState(0);
  // 세션 수립 콜백에서 "직전에 비로그인이었는지"를 읽기 위한 최신값(렌더와 무관한 판정용).
  const statusRef = useRef<AuthStatus>("loading");
  const nativeAvailable = useSyncExternalStore(
    subscribeNoop,
    isNativeBridgeAvailable,
    () => false,
  );

  // 외부 브라우저 로그인 유도 폴백 — 네이티브 프롬프트 메시지를 받을 상대가 없을 때 띄운다.
  const openInApp = useOpenInAppPrompt();

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
    const next: AuthStatus = state?.authenticated ? "authenticated" : "anonymous";
    statusRef.current = next;
    setStatus(next);
  }, []);

  const refresh = useCallback(async () => {
    const state = await fetchSessionState({ method: "GET" });
    applyState(state);
  }, [applyState]);

  // 네이티브 토큰 → 서버 세션 수립
  const establishSession = useCallback(
    async (accessToken: string) => {
      const state = await fetchSessionState({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });

      // loading에서 온 경우는 세지 않는다 — 네이티브가 WEBVIEW_READY에 기존 토큰을 재주입하는
      // 평범한 진입이라 화면은 이미 로그인 상태로 그려져 있다.
      const loggedIn =
        statusRef.current === "anonymous" && state?.authenticated === true;
      applyState(state);
      if (loggedIn) setLoginCount((count) => count + 1);

      // 만료 복구로 세션 재수립을 기다리던 BFF 호출을 진행/중단시킨다.
      if (state?.authenticated) {
        notifySessionRefreshed();
      } else {
        notifySessionRefreshFailed();
      }

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
          void establishSession(message.payload.accessToken);
          return;
        case InboundMessageType.AUTH_LOGIN_CANCELLED:
          // 사용자가 로그인을 취소했으므로 대기 중 행위를 폐기한다.
          pendingActionRef.current = null;
          return;
        case InboundMessageType.AUTH_SESSION_EXPIRED:
        case InboundMessageType.AUTH_LOGOUT:
          // 갱신 대기 중이던 BFF 호출에 실패를 전파한 뒤 세션을 정리한다.
          notifySessionRefreshFailed();
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
      // 외부 브라우저에는 로그인 UI를 그릴 네이티브가 없다 — 메시지를 보내봐야 아무 일도 안 생기고
      // 사용자는 "눌렀는데 반응이 없다"로 읽는다. 앱에서 로그인해 이어가라는 안내로 대체한다.
      if (!nativeAvailable) {
        openInApp.prompt();
        return;
      }

      const type = direct
        ? OutboundMessageType.AUTH_LOGIN_MODAL
        : OutboundMessageType.AUTH_LOGIN_PROMPT;
      const payload = reason ? { reason } : undefined;
      logEvent("out", type, payload);
      postToNative({ type, payload });
    },
    [logEvent, nativeAvailable, openInApp],
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

  const promptLogin = useCallback(
    (options?: RequireAuthOptions) => {
      // 앞서 보관된 행위가 이번 로그인에 딸려 실행되지 않게 비운다.
      pendingActionRef.current = null;
      requestLogin(options?.direct ?? false, options?.reason);
    },
    [requestLogin],
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
    promptLogin,
    loginCount,
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

/**
 * 지금 로그인 상태로 그려야 하는지.
 *
 * 세션 판정 전(loading)에는 서버가 요청 쿠키로 본 힌트(SessionHint)를 쓴다 — 판정을 기다려 숨겼다가
 * 보여주면 로그인 사용자에게 알림 종·⋮가 매번 늦게 튀어나오고, SSR 마크업과도 어긋난다.
 * 힌트가 없는 화면에서는 비로그인으로 본다.
 */
export function useIsSignedIn(): boolean {
  const { status } = useAuth();
  const hint = useSessionHint();

  if (status === "loading") return hint;
  return status === "authenticated";
}

/**
 * 비로그인 → 로그인 전환 시 콜백을 한 번 실행한다(마운트 시점에는 실행하지 않는다).
 *
 * 비로그인으로 그려진 화면은 viewer 상태(좋아요·저장·소유자)가 전부 "아님"이라, 로그인 후 다시 읽지
 * 않으면 이미 좋아요한 글이 비활성으로, 내 글 ⋮가 신고/숨기기로 남는다(#173).
 */
export function useOnLogin(callback: () => void): void {
  const { loginCount } = useAuth();
  const callbackRef = useRef(callback);
  const seenRef = useRef(loginCount);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    if (seenRef.current === loginCount) return;
    seenRef.current = loginCount;
    callbackRef.current();
  }, [loginCount]);
}
