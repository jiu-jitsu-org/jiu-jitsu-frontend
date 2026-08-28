import {
  OutboundMessageType,
  type BridgeMessage,
  type InboundMessage,
  type OpenSubviewPayload,
  type ShareSheetPayload,
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

  switch (detectPlatform()) {
    case "ios":
      window.webkit?.messageHandlers?.[APP_BRIDGE_HANDLER_NAME]?.postMessage(
        message,
      );
      return;
    case "android":
      window.AppBridge?.postMessage(JSON.stringify(message));
      return;
    default:
      // 웹 단독(개발) 폴백: 네이티브가 없으므로 콘솔로만 흐름을 확인한다.
      console.info("[native-bridge] (web fallback) → native", message);
  }
}

/**
 * 풀스크린 웹뷰 서브뷰를 열도록 네이티브에 요청한다(게시글 상세 등).
 *
 * url은 동일 origin 절대경로여야 새 웹뷰가 세션 쿠키를 공유한다.
 * "언제 이걸 쓸지(네이티브 vs 웹 라우터)"는 호출부가 `isNativeBridgeAvailable()`로 판단한다.
 */
export function openNativeSubview(
  url: string,
  options?: Pick<OpenSubviewPayload, "title" | "presentation">,
): void {
  postToNative({
    type: OutboundMessageType.OPEN_SUBVIEW,
    payload: { url, ...options },
  });
}

/** 현재 서브뷰(풀 웹뷰)를 닫도록 네이티브에 요청한다(pop). 웹 헤더 뒤로가기에서 사용. */
export function closeNativeSubview(): void {
  postToNative({ type: OutboundMessageType.CLOSE_SUBVIEW });
}

/**
 * 네이티브 시스템 공유 시트를 띄우도록 요청한다.
 *
 * 결과를 기다리지 않는 단방향 메시지다 — 어디로 공유했든 시트를 닫았든 웹이 이어붙일 후처리가 없어
 * requestId·회신이 필요 없다(알럿·선택 시트와 다른 점).
 *
 * 호출부는 navigator.share가 없을 때만 이걸 쓴다. Web Share API가 있으면 엔진이 OS 공유 시트를
 * 직접 띄우므로(WKWebView 포함) 굳이 브릿지를 태우지 않는 편이 앱 배포와 결합되지 않는다.
 */
export function showNativeShareSheet(
  url: string,
  options?: Pick<ShareSheetPayload, "title">,
): void {
  postToNative({
    type: OutboundMessageType.SHOW_SHARE_SHEET,
    payload: { url, ...options },
  });
}

/**
 * 인바운드 수신구는 `window.WebBridge` 단 하나뿐(네이티브가 이 경로로만 호출)인데,
 * 듣고 싶은 주체는 여럿이다(auth 세션 + 서브웹뷰의 BACK_PRESSED 등).
 * 그래서 수신구는 모듈이 한 번만 설치하고, 들어온 메시지를 등록된 모든 리스너에 fan-out 한다.
 */
const inboundListeners = new Set<(message: InboundMessage) => void>();

/** window.WebBridge.receive를 (없으면) 한 번만 설치한다 — 모든 리스너에 분배하는 단일 수신구. */
function ensureInboundReceiver(): void {
  if (typeof window === "undefined" || window.WebBridge) {
    return;
  }

  window.WebBridge = {
    // 네이티브는 `window.WebBridge.receive("<json>")`를 호출한다(`evaluateJavaScript`).
    // 일부 구현이 문자열 대신 객체를 넘길 수 있어 양쪽 모두 허용한다.
    receive: (raw) => {
      try {
        const message = (
          typeof raw === "string" ? JSON.parse(raw) : raw
        ) as InboundMessage;
        // 리스너 하나가 던져도 나머지 분배가 끊기지 않게 개별 보호한다.
        for (const listener of inboundListeners) {
          try {
            listener(message);
          } catch (error) {
            console.error("[native-bridge] inbound listener threw", error);
          }
        }
      } catch (error) {
        console.error("[native-bridge] failed to parse inbound message", error);
      }
    },
  };
}

/**
 * 네이티브 → 웹 인바운드 리스너를 등록한다(여러 곳에서 동시 등록 가능).
 *
 * 첫 등록 시 단일 수신구(window.WebBridge)를 설치하고, 마지막 해제 시 제거한다.
 * 각 리스너는 모든 메시지를 받으므로 호출부가 `message.type`으로 필요한 것만 분기한다.
 *
 * @returns 등록 해제 함수(useEffect cleanup에서 호출)
 */
export function registerWebBridge(
  handler: (message: InboundMessage) => void,
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  inboundListeners.add(handler);
  ensureInboundReceiver();

  return () => {
    inboundListeners.delete(handler);
    // 남은 리스너가 없으면 수신구도 거둔다(테스트/언마운트 시 전역 누수 방지).
    if (inboundListeners.size === 0 && window.WebBridge) {
      delete window.WebBridge;
    }
  };
}
