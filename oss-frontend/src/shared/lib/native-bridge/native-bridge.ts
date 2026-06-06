import {
  BRIDGE_SCHEMA_VERSION,
  type BridgeMessage,
  type InboundMessage,
} from "./messages";

/**
 * 네이티브 브릿지 어댑터.
 *
 * 역할:
 * - 웹 → 네이티브 전송(`postToNative`)에서 iOS/Android 호출 차이를 흡수한다.
 * - 네이티브 → 웹 수신구(`window.WebBridge.receive`)를 등록한다(`registerWebBridge`).
 * - 네이티브가 없는 브라우저 단독 실행(개발/테스트)에서는 폴백으로 동작한다.
 *
 * window 전역 직접 접근은 이 파일로만 한정한다. (캡슐화)
 */

/** iOS/Android가 주입하는 수신구 이름. 계약상 두 플랫폼 동일. */
const APP_BRIDGE_HANDLER_NAME = "AppBridge";

export type BridgePlatform = "ios" | "android" | "web";

/** 현재 브릿지가 어느 플랫폼에 연결돼 있는지 감지한다. */
export function detectPlatform(): BridgePlatform {
  if (typeof window === "undefined") {
    return "web";
  }

  if (window.webkit?.messageHandlers?.[APP_BRIDGE_HANDLER_NAME]) {
    return "ios";
  }

  if (window.AppBridge) {
    return "android";
  }

  return "web";
}

/** 네이티브 브릿지가 실제로 연결돼 있는지 여부(웹 단독이면 false). */
export function isNativeBridgeAvailable(): boolean {
  return detectPlatform() !== "web";
}

/**
 * 웹 → 네이티브 메시지 전송.
 *
 * iOS는 객체를 그대로 받을 수 있고(`postMessage(obj)`), Android JS 인터페이스는
 * 문자열만 받으므로 직렬화해서 넘긴다. 웹 단독에서는 콘솔 폴백으로 표시한다.
 */
export function postToNative(message: BridgeMessage): void {
  if (typeof window === "undefined") {
    return;
  }

  const envelope: BridgeMessage = { version: BRIDGE_SCHEMA_VERSION, ...message };

  switch (detectPlatform()) {
    case "ios":
      window.webkit?.messageHandlers?.[APP_BRIDGE_HANDLER_NAME]?.postMessage(
        envelope,
      );
      return;
    case "android":
      window.AppBridge?.postMessage(JSON.stringify(envelope));
      return;
    default:
      // 웹 단독(개발) 폴백: 네이티브가 없으므로 콘솔로만 흐름을 확인한다.
      console.info("[native-bridge] (web fallback) → native", envelope);
  }
}

/**
 * 네이티브 → 웹 수신구를 등록한다.
 *
 * 네이티브는 `window.WebBridge.receive("<json>")`를 호출한다(`evaluateJavaScript`).
 * 일부 구현이 문자열 대신 객체를 넘길 수 있어 양쪽 모두 허용한다.
 *
 * @returns 등록 해제 함수(useEffect cleanup에서 호출)
 */
export function registerWebBridge(
  handler: (message: InboundMessage) => void,
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.WebBridge = {
    receive: (raw) => {
      try {
        const message = (
          typeof raw === "string" ? JSON.parse(raw) : raw
        ) as InboundMessage;
        handler(message);
      } catch (error) {
        console.error("[native-bridge] failed to parse inbound message", error);
      }
    },
  };

  return () => {
    if (window.WebBridge) {
      delete window.WebBridge;
    }
  };
}
