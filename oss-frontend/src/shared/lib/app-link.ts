/**
 * 외부 브라우저에서 앱으로 넘기는 링크 규칙.
 *
 * WHY 유니버설 링크가 아니라 커스텀 스킴인가:
 * iOS는 "이미 보고 있는 페이지와 같은 도메인"의 링크를 탭했을 때 유니버설 링크를 발동시키지 않는다.
 * 공유 링크로 들어온 상세 페이지 위의 '앱 열기'가 정확히 그 경우라, 그 경로로는 앱이 열리지 않는다.
 * 스크립트 내비게이션(location.href)에도 반응하지 않아 우회도 불가능하다 — 실기기로 확인했다(#72).
 *
 * 앱은 이 스킴을 받아 안에 실린 https URL을 꺼낸 뒤 기존 유니버설 링크와 같은 검증을 태운다.
 * 그래서 목적지는 여전히 지금 보고 있는 URL 그대로이고, 쿼리 파라미터가 늘어도 앱 재배포가 필요 없다.
 * 계약: jiu-jitsu-org/jiu-jitsu-ios#25
 */

/** iOS가 Info.plist(CFBundleURLTypes)에 등록한 스킴. 바꾸면 앱도 함께 배포해야 한다. */
const APP_SCHEME = "bjjossapp";

/** App Store 앱 ID (com.jiujitsulab.connect). */
const APP_STORE_ID = "6760534202";

/**
 * 스킴을 연 뒤 앱 전환을 기다리는 시간.
 *
 * 짧으면 앱이 뜨기 전에 App Store로 튀고, 길면 미설치 사용자가 멍하니 기다린다.
 * 확인 알럿(iOS가 커스텀 스킴에 한 번 띄운다)을 읽고 수락하는 시간까지 감안한 값이다.
 */
const APP_STORE_FALLBACK_DELAY_MS = 2000;

export const APP_STORE_URL = `https://apps.apple.com/kr/app/id${APP_STORE_ID}`;

/**
 * 지금 보고 있는 페이지를 앱에서 열기 위한 스킴 URL.
 *
 * `encodeURIComponent`는 필수다 — 인코딩하지 않으면 원본 URL에 `&`가 있을 때
 * 앱이 payload를 첫 파라미터에서 잘라 읽는다.
 */
export function buildOpenInAppUrl(currentUrl: string): string {
  return `${APP_SCHEME}://open?url=${encodeURIComponent(currentUrl)}`;
}

/**
 * 스킴으로 앱이 열리지 않으면 App Store로 보낸다.
 *
 * 앱이 열리면 페이지가 백그라운드로 가면서 visibilitychange/pagehide가 발화하므로 그때 취소한다.
 * 미설치면 아무 일도 일어나지 않아 타이머가 그대로 만료된다.
 *
 * 한계: 앱이 있어도 iOS 확인 알럿을 사용자가 "취소"하면 페이지가 계속 보이는 상태라 App Store로
 * 넘어간다. 알럿 취소를 감지할 웹 API가 없어 감수한다(스킴 방식의 알려진 트레이드오프).
 */
export function scheduleAppStoreFallback(
  delayMs: number = APP_STORE_FALLBACK_DELAY_MS,
): void {
  const timer = window.setTimeout(() => {
    cleanup();
    window.location.href = APP_STORE_URL;
  }, delayMs);

  function cleanup() {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("pagehide", cancel);
  }

  function cancel() {
    window.clearTimeout(timer);
    cleanup();
  }

  function handleVisibilityChange() {
    if (document.hidden) cancel();
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("pagehide", cancel);
}
