import {
  contentIdOf,
  contentOfPath,
  track,
  type AnalyticsContentType,
} from "@/shared/lib/analytics";
import {
  isNativeBridgeAvailable,
  showNativeShareSheet,
} from "@/shared/lib/native-bridge";

/** 공유 방법 — 공유 주소의 `utm_source`이자 `share` 기록의 method(#579). */
type ShareMethod = "system_sheet" | "native_sheet" | "copy_link";

/**
 * 공유 주소: 지금 페이지(쿼리 · 해시는 뗌) + 공유 표시(#579).
 * `utm_source`=공유 방법, `utm_medium`=share, `utm_campaign`=대상 종류. 사람 정보는 싣지 않는다.
 * 앱은 `utm_medium=share`로 열린 것을 공유 링크로 센다(app_open from=share_link).
 */
function shareUrl(method: ShareMethod, contentType: AnalyticsContentType): string {
  const params = new URLSearchParams({
    utm_source: method,
    utm_medium: "share",
    utm_campaign: contentType,
  });
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

/** 공유 시트를 열었거나 링크를 복사했다(완료 여부는 알 수 없다). */
function trackShare(method: ShareMethod, contentType: AnalyticsContentType) {
  // id는 지금 주소에서 읽는다(상세 화면 · 종류가 맞을 때만).
  const content = contentOfPath(window.location.pathname);
  track("share", {
    content_type: contentType,
    content_id:
      content?.type === contentType
        ? contentIdOf(contentType, content.id)
        : undefined,
    method,
  });
}

/**
 * 지금 보고 있는 페이지 공유 — navigator.share → 네이티브 브릿지 → 링크 복사 순.
 *
 * navigator.share를 맨 앞에 두는 이유: 이 API는 웹이 그린 UI가 아니라 엔진이 OS 공유 시트를
 * 직접 present 한다. iOS 웹뷰(WKWebView)가 이를 구현하고 있어 앱 안에서도 이미 네이티브
 * 시트가 뜬다 — 무조건 브릿지로 보내면 iOS가 SHOW_SHARE_SHEET를 구현·배포하기 전까지
 * 공유가 무반응이 된다(회신 없는 단방향이라 웹이 실패를 감지해 되돌릴 수도 없다).
 *
 * 브릿지는 navigator.share가 없는 웹뷰(Android WebView)를 위한 경로다. 앱이 공유 항목·
 * 제외 액티비티를 직접 소유해야 할 때가 오면 이 순서만 뒤집으면 된다.
 *
 * 공유 URL은 현재 페이지의 절대 URL을 환경별 origin 그대로 쓰되 쿼리(정렬 등)·해시는 뗀다.
 * 열람 맥락일 뿐 공유받는 사람에게는 의미가 없기 때문. 대신 공유 표시(utm)를 붙인다(#579).
 *
 * 게시글 · 밸런스 게임 · 대회 상세가 함께 쓴다 — contentType은 기록(utm_campaign · content_type)에만 쓴다.
 */
export async function shareCurrentPage(
  contentType: AnalyticsContentType,
): Promise<void> {
  if (navigator.share) {
    trackShare("system_sheet", contentType);
    try {
      await navigator.share({ url: shareUrl("system_sheet", contentType) });
    } catch {
      // 사용자가 공유 시트를 닫은 경우 등 — 무시.
    }
    return;
  }

  if (isNativeBridgeAvailable()) {
    trackShare("native_sheet", contentType);
    showNativeShareSheet(shareUrl("native_sheet", contentType));
    return;
  }

  try {
    await navigator.clipboard.writeText(shareUrl("copy_link", contentType));
    trackShare("copy_link", contentType);
  } catch {
    // 클립보드 접근 실패 — 조용히 무시.
  }
}
