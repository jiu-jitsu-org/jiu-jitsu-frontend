/**
 * 하이드레이션 전에 한 번 도는 클라이언트 진입점(Next 16 `instrumentation-client`).
 *
 * 화면 기록(#576): 문서 로드 때 지금 화면을, 같은 웹뷰 안 라우터 이동(push · replace · 뒤로)마다 새 화면을 알린다.
 * 앱 웹뷰의 기록은 WEBVIEW_READY 뒤로 미뤄졌다가 나가고(track), 언제 셀지는 앱이 정한다.
 * 기록이 실패해도 화면은 그대로 떠야 하므로 던지지 않는다.
 */
import {
  reportDocumentScreen,
  reportRestoredPage,
  reportScreenForUrl,
} from "@/shared/lib/analytics/screen-view";
import { initWebTag } from "@/shared/lib/analytics/web-tag";

try {
  // 앱 밖 브라우저면 GA 웹 태그를 준비한다(#579). 그 전 기록은 track이 모아 둔다.
  initWebTag();
  reportDocumentScreen();
  // 브라우저 뒤로 가기로 bfcache에서 되살아난 문서는 이 파일이 다시 돌지 않는다 — 다시 보인 화면으로 센다.
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) reportRestoredPage();
  });
} catch {
  // 기록 실패는 무시한다.
}

export function onRouterTransitionStart(
  url: string,
  navigationType: "push" | "replace" | "traverse",
): void {
  try {
    // traverse = 브라우저 뒤로 · 앞으로 가기(popstate) — 다시 보인 화면은 from=back.
    reportScreenForUrl(url, { back: navigationType === "traverse" });
  } catch {
    // 기록 실패는 무시한다.
  }
}
