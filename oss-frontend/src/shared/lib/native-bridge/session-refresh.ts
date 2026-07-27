import { OutboundMessageType } from "./messages";
import { isNativeBridgeAvailable, postToNative } from "./native-bridge";

/**
 * 만료 토큰 복구 코디네이터.
 *
 * WHY: refreshToken은 네이티브 Keychain에만 있어 웹은 스스로 토큰을 갱신할 수 없다. BFF 호출이
 * 만료(백엔드 A0003)로 실패하면 네이티브에 `AUTH_TOKEN_REFRESH_REQUEST`를 보내 갱신을 위임하고,
 * 네이티브가 새 토큰으로 세션을 재수립(AUTH_LOGIN_SUCCESS)할 때까지 기다린 뒤 호출부가 재시도한다.
 *
 * 갱신 완료/실패 통지는 브릿지 수신구를 소유한 `AuthProvider`가 establishSession 결과에 맞춰
 * `notifySessionRefreshed` / `notifySessionRefreshFailed`로 알린다.
 */

/** 네이티브가 무응답일 때 무한 대기를 막는 상한. */
const REFRESH_TIMEOUT_MS = 15_000;

type Waiter = { resolve: () => void; reject: (reason: Error) => void };

let inFlight: Promise<void> | null = null;
let waiter: Waiter | null = null;
let timeoutId: ReturnType<typeof setTimeout> | null = null;

function settle(ok: boolean, reason?: Error) {
  if (timeoutId !== null) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
  const current = waiter;
  inFlight = null;
  waiter = null;
  if (!current) return;
  if (ok) current.resolve();
  else current.reject(reason ?? new Error("session refresh failed"));
}

/**
 * 네이티브에 토큰 갱신을 요청하고 세션 재수립까지 기다린다(single-flight).
 * 이미 진행 중이면 같은 Promise를 공유해 동시 만료들이 갱신을 1회로 합친다.
 */
export function refreshSessionViaBridge(): Promise<void> {
  if (inFlight) return inFlight;

  // 네이티브가 없으면(웹 단독/SSR) 위임할 대상이 없어 즉시 실패시킨다(타임아웃 대기 방지).
  if (!isNativeBridgeAvailable()) {
    return Promise.reject(new Error("native bridge unavailable"));
  }

  inFlight = new Promise<void>((resolve, reject) => {
    waiter = { resolve, reject };
    timeoutId = setTimeout(
      () => settle(false, new Error("token refresh timeout")),
      REFRESH_TIMEOUT_MS,
    );
    postToNative({ type: OutboundMessageType.AUTH_TOKEN_REFRESH_REQUEST });
  });

  return inFlight;
}

/** 세션이 재수립됨(AUTH_LOGIN_SUCCESS 처리 완료) — 대기 중 재시도를 진행시킨다. */
export function notifySessionRefreshed(): void {
  settle(true);
}

/** 갱신 실패(AUTH_SESSION_EXPIRED/로그아웃) — 대기 중 호출부에 실패를 전파한다. */
export function notifySessionRefreshFailed(): void {
  settle(false, new Error("session expired"));
}
