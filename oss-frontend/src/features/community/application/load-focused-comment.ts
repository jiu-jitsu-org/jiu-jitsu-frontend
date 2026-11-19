import { createGetCommentThreadUseCase } from "@/features/community/application/community-use-case-factory";
import type { CommentThread } from "@/features/community/domain/comment";
import type { CommentSort } from "@/features/community/domain/post";

/**
 * 알림에서 연 댓글 묶음을 읽는다(#596) — 게시글 · 밸런스 게임 상세가 댓글 첫 페이지와 함께 부른다.
 *
 * 덧붙는 정보라 못 읽으면 null로 빠질 뿐 상세는 그대로 뜬다:
 * - 지워졌거나 관리자가 숨긴 댓글(404 COMMENT_NOT_FOUND) · 네트워크 실패
 * - 주소의 글과 다른 글의 댓글(손으로 고친 주소 등)
 * 삭제 · 신고 · 차단된 댓글은 404가 아니라 목록처럼 자리 표시로 온다(backend#271).
 */
export async function loadFocusedComment(
  contentId: number,
  commentId: number | null,
  sort: CommentSort,
  accessToken: string | null,
): Promise<CommentThread | null> {
  if (commentId === null) return null;

  try {
    const thread = await createGetCommentThreadUseCase(accessToken).execute(
      commentId,
      sort,
    );
    return thread.contentId === contentId ? thread : null;
  } catch {
    return null;
  }
}
