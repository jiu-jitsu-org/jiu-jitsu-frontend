import { notFound } from "next/navigation";

import { normalizeCommentSort } from "@/features/community/domain/post";
import { PostDetailScreen } from "@/features/community/presentation/post-detail-screen";

/**
 * 게시글 상세 라우트 (얇은 엔트리).
 *
 * Next.js 16: params/searchParams는 Promise이므로 await로 푼다.
 * 라우팅·파라미터 추출만 담당하고 데이터 조회/렌더는 PostDetailScreen(feature)에 위임한다.
 */
export default async function CommunityPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { id } = await params;
  const { sort } = await searchParams;

  const postId = Number(id);
  if (!Number.isInteger(postId) || postId <= 0) {
    notFound();
  }

  return (
    <PostDetailScreen postId={postId} sort={normalizeCommentSort(sort)} />
  );
}
