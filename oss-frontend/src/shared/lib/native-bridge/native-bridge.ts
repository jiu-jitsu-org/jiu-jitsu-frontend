import {
  OutboundMessageType,
  type AnalyticsEventPayload,
  type AuthLoginPayload,
  type BridgeMessage,
  type InboundMessage,
  type CompetitionAlertsEnabledPayload,
  type CompetitionHeaderTintPayload,
  type ContentCreatedPayload,
  type HomeHeaderTintPayload,
  type LoginPromptReason,
  type OpenCompetitionRecordPayload,
  type OpenHomeFeedPayload,
  type OpenSubviewPayload,
  type OpenUserProfilePayload,
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
 * 앱이 이 웹→앱 메시지를 처리할 수 있는지(#264).
 *
 * 네이티브는 페이지 스크립트보다 먼저 `window.AppBridgeCapabilities = ["PICK_PHOTOS", ...]`를 주입한다
 * (iOS WKUserScript atDocumentStart). 보내기 전에 바로 알아야 하는 메시지에 쓴다 — 예: 앨범 선택은
 * 탭 직후 file input을 열어야 해서 "보내 보고 응답이 없으면 폴백"이 불가능하다.
 * 목록을 주입하지 않는 구버전 앱·브라우저는 전부 false.
 */
export function supportsNativeMessage(type: OutboundMessageType): boolean {
  if (typeof window === "undefined" || !isNativeBridgeAvailable()) {
    return false;
  }
  const capabilities = window.AppBridgeCapabilities;
  return Array.isArray(capabilities) && capabilities.includes(type);
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
      break;
    case "android":
      window.AppBridge?.postMessage(JSON.stringify(message));
      break;
    default:
      // 웹 단독(개발) 폴백: 네이티브가 없으므로 콘솔로만 흐름을 확인한다.
      console.info("[native-bridge] (web fallback) → native", message);
      return;
  }

  if (message.type === OutboundMessageType.WEBVIEW_READY) {
    markWebViewReady();
  }
}

/**
 * WEBVIEW_READY를 보냈는지(#575). 문서마다 AuthProvider가 마운트 때 한 번 보낸다.
 * 그 전(하이드레이션 전 등)에 생긴 메시지 중 순서가 중요하지 않은 것(분석 기록)은 이 뒤로 미룬다 —
 * 앱이 이 웹뷰와 핸드셰이크를 끝낸 뒤에 받게 하기 위해서다.
 */
let webViewReady = false;
const webViewReadyCallbacks: Array<() => void> = [];

function markWebViewReady(): void {
  if (webViewReady) return;
  webViewReady = true;
  const callbacks = webViewReadyCallbacks.splice(0);
  for (const callback of callbacks) {
    try {
      callback();
    } catch (error) {
      console.error("[native-bridge] web view ready callback threw", error);
    }
  }
}

/** WEBVIEW_READY를 이미 보냈으면 바로, 아니면 보낸 직후에 한 번 부른다. */
export function whenWebViewReady(callback: () => void): void {
  if (webViewReady) {
    callback();
    return;
  }
  webViewReadyCallbacks.push(callback);
}

/**
 * 네이티브 화면을 쌓기 전에 입력 포커스를 푼다(#484).
 *
 * 키보드를 올린 채 화면을 쌓으면 키보드가 이 웹뷰가 가려진 사이에 내려가, 돌아왔을 때
 * visualViewport가 키보드 높이를 뺀 옛 값으로 남는다(댓글 입력 바가 떠 있음). 보이는 동안 내려야
 * resize가 제때 온다.
 */
function releaseFocus(): void {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

/**
 * 풀스크린 웹뷰 서브뷰를 열도록 네이티브에 요청한다(게시글 상세 등).
 *
 * url은 동일 origin 절대경로여야 새 웹뷰가 세션 쿠키를 공유한다.
 * "언제 이걸 쓸지(네이티브 vs 웹 라우터)"는 호출부가 `isNativeBridgeAvailable()`로 판단한다.
 */
export function openNativeSubview(url: string): void {
  releaseFocus();
  postToNative({
    type: OutboundMessageType.OPEN_SUBVIEW,
    payload: { url } satisfies OpenSubviewPayload,
  });
}

/**
 * 네이티브 로그인 안내(알럿 → 동의하면 로그인 모달)를 띄운다. 이유는 앱의 로그인 기록(GA)에 실린다(#577).
 * 로그인 뒤 이어 할 행위를 보관하지 않는다 — 그런 곳은 `useAuth().requireAuth`를 쓴다.
 * 401 응답처럼 로그인으로 알던 화면에서 세션이 끝난 곳이 부른다. 브라우저에는 띄울 앱이 없다.
 */
export function requestNativeLogin(reason: LoginPromptReason): void {
  postToNative({
    type: OutboundMessageType.AUTH_LOGIN_PROMPT,
    payload: { reason } satisfies AuthLoginPayload,
  });
}

/** 현재 서브뷰(풀 웹뷰)를 닫도록 네이티브에 요청한다(pop). 웹 헤더 뒤로가기에서 사용. */
export function closeNativeSubview(): void {
  postToNative({ type: OutboundMessageType.CLOSE_SUBVIEW });
}

/**
 * 작성자 프로필을 열도록 네이티브에 요청한다(#271). 남이면 회원 프로필 화면, 나(isMe)면 MY 탭.
 *
 * 프로필 화면은 네이티브 소유라 이 메시지에는 웹 폴백이 없다 — 호출부가 `isNativeBridgeAvailable()`로 가른다.
 */
export function openNativeUserProfile(payload: OpenUserProfilePayload): void {
  releaseFocus();
  postToNative({ type: OutboundMessageType.OPEN_USER_PROFILE, payload });
}

/**
 * 관심 대회 알림을 켰다고 알린다(#375). 앱은 기기 알림이 꺼져 있으면 켜는 방법을 안내한다.
 * 브릿지가 없는 브라우저에서는 보내지 않는다 — 알림을 받을 앱이 없다.
 */
export function notifyCompetitionAlertsEnabled(
  payload: CompetitionAlertsEnabledPayload,
): void {
  if (!isNativeBridgeAvailable()) return;
  postToNative({
    type: OutboundMessageType.COMPETITION_ALERTS_ENABLED,
    payload,
  });
}

/**
 * 글 · 댓글을 등록했다고 알린다(#495). 앱은 이걸로 알림 권한 안내를 띄울지 정한다.
 * 등록에 성공했을 때만, 한 번 등록에 한 번 부른다. 브릿지가 없는 브라우저에서는 보내지 않는다.
 */
export function notifyContentCreated(
  kind: ContentCreatedPayload["kind"],
): void {
  if (!isNativeBridgeAvailable()) return;
  postToNative({
    type: OutboundMessageType.CONTENT_CREATED,
    payload: { kind } satisfies ContentCreatedPayload,
  });
}

/**
 * 분석 기록 하나를 앱에 넘긴다(#575). 앱이 `ANALYTICS_EVENT`를 지원하지 않으면 보내지 않고 false.
 * 꼬리표 정리 · 준비 전 대기는 `track()`(shared/lib/analytics)이 맡는다 — 화면 코드는 이걸 직접 부르지 않는다.
 */
export function postNativeAnalyticsEvent(
  payload: AnalyticsEventPayload,
): boolean {
  if (!supportsNativeMessage(OutboundMessageType.ANALYTICS_EVENT)) {
    return false;
  }
  postToNative({ type: OutboundMessageType.ANALYTICS_EVENT, payload });
  return true;
}

/**
 * 앱 홈 탭(피드)으로 가도록 요청한다(#366). 지원하지 않는 앱이면 false — 호출부가 다른 길로 연다.
 * payload에 대회 번호를 주면 앱이 홈 피드를 그 대회 글만으로 연다(#597 · jiu-jitsu-ios#437).
 * 카테고리 번호를 주면 홈 피드를 그 카테고리 탭으로 연다(#643 · jiu-jitsu-ios#480).
 */
export function openNativeHomeFeed(payload?: OpenHomeFeedPayload): boolean {
  if (!supportsNativeMessage(OutboundMessageType.OPEN_HOME_FEED)) return false;
  releaseFocus();
  postToNative(
    payload
      ? { type: OutboundMessageType.OPEN_HOME_FEED, payload }
      : { type: OutboundMessageType.OPEN_HOME_FEED },
  );
  return true;
}

/**
 * 앱의 대회 기록 입력을 이 대회로 채워 열도록 요청한다(#368). 지원하지 않는 앱이면 false.
 */
export function openNativeCompetitionRecord(
  payload: OpenCompetitionRecordPayload,
): boolean {
  if (!supportsNativeMessage(OutboundMessageType.OPEN_COMPETITION_RECORD)) {
    return false;
  }
  releaseFocus();
  postToNative({ type: OutboundMessageType.OPEN_COMPETITION_RECORD, payload });
  return true;
}

/**
 * 앱의 대회 탭 머리(제목 줄·상태바)를 이 색으로 칠하도록 요청한다. null이면 앱 기본색으로 돌린다.
 * 지원하지 않는 앱·브라우저에서는 보내지 않는다(머리는 앱 기본색 그대로).
 */
export function setNativeCompetitionHeaderTint(
  color: CompetitionHeaderTintPayload["color"],
): void {
  if (!supportsNativeMessage(OutboundMessageType.COMPETITION_HEADER_TINT)) {
    return;
  }
  postToNative({
    type: OutboundMessageType.COMPETITION_HEADER_TINT,
    payload: { color },
  });
}

/**
 * 앱의 홈 머리(로고 줄·상태바)를 이 색으로 칠하도록 요청한다. null이면 앱 기본색(흰 머리)으로 돌린다.
 * 지원하지 않는 앱·브라우저에서는 보내지 않는다.
 */
export function setNativeHomeHeaderTint(
  color: HomeHeaderTintPayload["color"],
): void {
  if (!supportsNativeMessage(OutboundMessageType.HOME_HEADER_TINT)) return;
  postToNative({
    type: OutboundMessageType.HOME_HEADER_TINT,
    payload: { color },
  });
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
export function showNativeShareSheet(url: string): void {
  postToNative({
    type: OutboundMessageType.SHOW_SHARE_SHEET,
    payload: { url } satisfies ShareSheetPayload,
  });
}

/**
 * 인바운드 수신구는 `window.WebBridge` 단 하나뿐(네이티브가 이 경로로만 호출)인데,
 * 듣고 싶은 주체는 여럿이다(auth 세션 + 알럿·시트 결과 회신 등).
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
