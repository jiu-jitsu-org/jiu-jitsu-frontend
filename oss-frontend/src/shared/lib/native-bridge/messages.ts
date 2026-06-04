/**
 * 네이티브 ↔ 웹뷰 브릿지 메시지 계약 (웹 측 정본).
 *
 * WHY 단일 출처:
 * - iOS/Android/웹이 동일한 message `type`/payload 스키마를 공유해야 한다.
 *   네이티브는 이 문자열들을 Swift `enum` / Kotlin `sealed class`로 1:1 매핑한다.
 * - 브릿지는 "단일 라우터" 방식이다. 행위마다 핸들러를 만들지 않고 하나의 브릿지에
 *   `type`으로 분기한다. (확장·테스트가 쉽고 플랫폼별 멘탈 모델이 동일)
 * - `type`을 UPPER_SNAKE_CASE 문자열로 두는 이유: 세 언어 모두에서 enum rawValue로
 *   그대로 쓸 수 있고 로그에서 grep 하기 쉽다. (전역 고정 상수 → SCREAMING_SNAKE_CASE)
 */

/** 브릿지 스키마 버전. 호환성 분기가 필요해질 때를 대비한 식별자. */
export const BRIDGE_SCHEMA_VERSION = 1;

/** 웹 → 네이티브 (window.(webkit.messageHandlers.)AppBridge) */
export const OutboundMessageType = {
  WEBVIEW_READY: "WEBVIEW_READY",
  // 로그인 유도 2종 (iOS가 단일 AUTH_LOGIN_REQUEST를 분리)
  //  - PROMPT: 네이티브가 "로그인이 필요해요" 안내 알럿 → 사용자가 동의해야 모달 (소프트 유도)
  //  - MODAL : 네이티브가 로그인 모달을 즉시 표시 (다이렉트)
  AUTH_LOGIN_PROMPT: "AUTH_LOGIN_PROMPT",
  AUTH_LOGIN_MODAL: "AUTH_LOGIN_MODAL",
  AUTH_LOGOUT_REQUEST: "AUTH_LOGOUT_REQUEST",
} as const;
export type OutboundMessageType =
  (typeof OutboundMessageType)[keyof typeof OutboundMessageType];

/** 네이티브 → 웹 (window.WebBridge.receive) */
export const InboundMessageType = {
  AUTH_LOGIN_SUCCESS: "AUTH_LOGIN_SUCCESS",
  AUTH_LOGIN_CANCELLED: "AUTH_LOGIN_CANCELLED",
  AUTH_SESSION_EXPIRED: "AUTH_SESSION_EXPIRED",
  AUTH_LOGOUT: "AUTH_LOGOUT",
} as const;
export type InboundMessageType =
  (typeof InboundMessageType)[keyof typeof InboundMessageType];

/** 로그인 유도(PROMPT/MODAL 공통) payload. 사유(분석/문구용, 선택). */
export type AuthLoginPayload = {
  reason?: string;
};

/** `AUTH_LOGIN_SUCCESS` payload. refreshToken은 네이티브가 보관하고 웹엔 accessToken만 전달. */
export type AuthLoginSuccessPayload = {
  accessToken: string;
  /** epoch millis. 세션 쿠키 maxAge 산정에 사용(선택). */
  expiresAt?: number;
};

/** 모든 브릿지 메시지의 공통 봉투(Envelope). */
export type BridgeMessage<P = unknown> = {
  type: string;
  payload?: P;
  /** (선택) 향후 요청-응답 짝맞춤용. 현재 미사용. */
  requestId?: string;
  version?: number;
};

/**
 * 네이티브 → 웹 인바운드 메시지의 판별 유니온.
 * 핸들러에서 `switch (message.type)`으로 안전하게 좁혀 쓰기 위함.
 */
export type InboundMessage =
  | { type: typeof InboundMessageType.AUTH_LOGIN_SUCCESS; payload: AuthLoginSuccessPayload; requestId?: string; version?: number }
  | { type: typeof InboundMessageType.AUTH_LOGIN_CANCELLED; requestId?: string; version?: number }
  | { type: typeof InboundMessageType.AUTH_SESSION_EXPIRED; requestId?: string; version?: number }
  | { type: typeof InboundMessageType.AUTH_LOGOUT; requestId?: string; version?: number };
