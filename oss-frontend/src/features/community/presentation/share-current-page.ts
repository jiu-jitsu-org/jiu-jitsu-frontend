import {
  isNativeBridgeAvailable,
  showNativeShareSheet,
} from "@/shared/lib/native-bridge";

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
 * 열람 맥락일 뿐 공유받는 사람에게는 의미가 없기 때문.
 *
 * 게시글 상세와 밸런스 게임 상세가 함께 쓴다 — 공유할 대상이 "지금 이 URL"이라 컨텐츠 종류에
 * 기대는 부분이 없다.
 */
export async function shareCurrentPage(): Promise<void> {
  const url = `${window.location.origin}${window.location.pathname}`;

  if (navigator.share) {
    try {
      await navigator.share({ url });
    } catch {
      // 사용자가 공유 시트를 닫은 경우 등 — 무시.
    }
    return;
  }

  if (isNativeBridgeAvailable()) {
    showNativeShareSheet(url);
    return;
  }

  try {
    await navigator.clipboard.writeText(url);
  } catch {
    // 클립보드 접근 실패 — 조용히 무시.
  }
}
