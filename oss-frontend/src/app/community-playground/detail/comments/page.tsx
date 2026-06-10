import { normalizeCommentSort } from "@/features/community/domain/post";

import { PostDetailCommentsPlaygroundPage } from "./comments-playground-page";

/**
 * 게시글 상세 (댓글) — 댓글 여러 개 mock 연결 경로
 * (`/community-playground/detail/comments`).
 *
 * 정렬 드롭다운 동작 시연을 위해 `?sort=`를 읽어 넘긴다(실제 라우트와 동일하게 searchParams 구동).
 */
export default async function CommunityDetailCommentsPlayground({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;

  return <PostDetailCommentsPlaygroundPage sort={normalizeCommentSort(sort)} />;
}
