import {
  closeNativeSubview,
  isNativeBridgeAvailable,
} from "@/shared/lib/native-bridge";

/**
 * 상세(게시글 · 밸런스 게임)를 닫고 이전 화면으로 돌아간다.
 *
 * 앱은 상세가 별도 서브뷰 웹뷰라 네이티브가 팝해야 하고, 웹 단독 진입은 브라우저 히스토리를
 * 되돌린다 — 두 경우 모두 "직전 화면으로 복귀"라는 같은 결과가 된다.
 *
 * 앱바 뒤로가기와 삭제 · 신고 · 숨기기 뒤 닫기가 모두 이 한 경로를 탄다(#144) — 뒤로가기를 웹이
 * 소유하면서 상세 2곳이 같은 분기를 갖게 되어 공용으로 뺐다.
 */
export function closeDetail(): void {
  if (isNativeBridgeAvailable()) {
    closeNativeSubview();
    return;
  }
  window.history.back();
}
