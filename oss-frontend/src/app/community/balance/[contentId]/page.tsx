import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getBalanceShareMetadata } from "@/features/community/application/get-balance-share-metadata";
import { normalizeCommentSort } from "@/features/community/domain/post";
import { BalanceDetailScreen } from "@/features/community/presentation/balance/balance-detail-screen";
import { getRequestOrigin } from "@/shared/lib/request-origin";
import { buildShareMetadata } from "@/shared/lib/site-metadata";

type BalancePageParams = Promise<{ contentId: string }>;

/** URL의 contentId를 정수로 푼다. 잘못된 URL이면 null. */
function parseContentId(contentId: string): number | null {
  const parsed = Number(contentId);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

/**
 * 공유 미리보기 메타데이터 — "오늘의 밸런스 게임 · A vs B" (게시글 상세와 같은 규칙).
 * 요약 실패는 루트 기본 메타데이터로 두고, 에러 화면 분기는 BalanceDetailScreen이 맡는다.
 */
export async function generateMetadata({
  params,
}: {
  params: BalancePageParams;
}): Promise<Metadata> {
  const { contentId } = await params;
  const parsed = parseContentId(contentId);
  if (parsed === null) return {};

  const [share, origin] = await Promise.all([
    getBalanceShareMetadata(parsed),
    getRequestOrigin(),
  ]);
  if (!share) return {};

  return buildShareMetadata({
    metadataBase: origin,
    title: share.title,
    description: share.description,
  });
}

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
  params: BalancePageParams;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { contentId } = await params;
  const { sort } = await searchParams;

  const parsed = parseContentId(contentId);
  if (parsed === null) {
    notFound();
  }

  return (
    <BalanceDetailScreen
      contentId={parsed}
      sort={normalizeCommentSort(sort)}
    />
  );
}
