import { notFound } from "next/navigation";

import { normalizeCommentSort } from "@/features/community/domain/post";
import { BalanceDetailScreen } from "@/features/community/presentation/balance/balance-detail-screen";

/**
 * 밸런스 게임 상세 라우트 (얇은 엔트리).
 *
 * Next.js 16: params/searchParams는 Promise이므로 await로 푼다.
 * 라우팅·파라미터 추출만 담당하고 데이터 조회/렌더는 BalanceDetailScreen(feature)에 위임한다
 * — 게시글 상세 라우트와 같은 형태다.
 *
 * 여기서 `notFound()`를 부르는 것은 **URL 자체가 잘못된 경우**(contentId가 정수가 아님)뿐이다.
 * 존재하지 않는 판은 조회를 해봐야 알 수 있어 화면 쪽(BalanceDetailGone)이 닫고 안내한다.
 */
export default async function BalanceGameDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ contentId: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { contentId } = await params;
  const { sort } = await searchParams;

  const parsed = Number(contentId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    notFound();
  }

  return (
    <BalanceDetailScreen
      contentId={parsed}
      sort={normalizeCommentSort(sort)}
    />
  );
}
