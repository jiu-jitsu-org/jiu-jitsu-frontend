import { loadBalanceGameDetail } from "@/features/community/application/get-balance-detail-page-data";
import { readSessionToken } from "@/shared/lib/auth";

/** 공유 미리보기 카드(og:*)에 실을 밸런스 게임 요약. */
export type BalanceShareMetadata = {
  title: string;
  /** "A vs B" — 두 선택지가 곧 이 판의 내용이다. */
  description: string;
};

/** 밸런스 게임은 사용자 제목이 없어 상세 화면의 고정 제목을 그대로 쓴다. */
const BALANCE_SHARE_TITLE = "오늘의 밸런스 게임";

/**
 * generateMetadata용 밸런스 게임 요약 조회.
 *
 * 게시글(getPostShareMetadata)과 같은 규칙 — 페이지 본문과 조회를 공유하고, 실패는 null로
 * 내려 기본 메타데이터로 폴백한다. 선택지 이미지는 1차 asset이 비어 있어(도메인 주석 참고)
 * 미리보기 이미지로 쓰지 않고 서비스 기본 카드를 쓴다.
 */
export async function getBalanceShareMetadata(
  contentId: number,
): Promise<BalanceShareMetadata | null> {
  const accessToken = await readSessionToken();

  try {
    const game = await loadBalanceGameDetail(contentId, accessToken);
    if (!game) return null;

    return {
      title: BALANCE_SHARE_TITLE,
      description: `${game.optionA.text} vs ${game.optionB.text}`,
    };
  } catch {
    return null;
  }
}
