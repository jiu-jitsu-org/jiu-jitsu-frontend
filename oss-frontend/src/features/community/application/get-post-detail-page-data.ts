import {
  createGetCommentsUseCase,
  createGetPostDetailUseCase,
} from "@/features/community/application/community-use-case-factory";
import type { Comment, CommentList } from "@/features/community/domain/comment";
import type { CommentSort, PostDetail } from "@/features/community/domain/post";
import { readSessionToken } from "@/shared/lib/auth";
import { toApiError } from "@/shared/lib/http";

export type PostDetailPageData = {
  post: PostDetail;
  comments: CommentList;
};

export type PostDetailPageDataResult =
  | { ok: true; data: PostDetailPageData }
  | { ok: false; status: number; code: string; error: string };

/** 댓글 API 미연동 시 폴백(상세만으로도 화면이 뜨도록). */
const EMPTY_COMMENTS: CommentList = { items: [], total: 0, nextCursor: null };

/**
 * 게시글 작성자가 쓴 댓글에 isPostAuthor=true를 채운다("작성자" 배지).
 *
 * 응답에 "댓글 작성자 == 게시글 작성자" 필드가 없어, 게시글 author id와 댓글 author id를
 * 비교해 도출한다. 대댓글까지 재귀 적용. (게시글+댓글이 함께 있는 이 레이어에서만 가능)
 */
function markPostAuthorComments(
  comments: Comment[],
  postAuthorId: number,
): Comment[] {
  return comments.map((comment) => ({
    ...comment,
    isPostAuthor: comment.author.userId === postAuthorId,
    replies: markPostAuthorComments(comment.replies, postAuthorId),
  }));
}

/**
 * 상세 화면 Server Component용 페이지 쿼리.
 *
 * 자체 BFF route로 다시 HTTP 요청하지 않고 application use case를 직접 호출한다.
 * Server Component -> Application -> Domain 계약 -> Infrastructure -> HTTP 흐름은 유지한다.
 * (bootstrap의 get-bootstrap-info-page-data 패턴)
 *
 * 세션 토큰이 있으면 함께 넘겨 viewer 상태를 채운다(비로그인도 본문 열람 가능).
 * 에러는 공통 ApiError로 정규화 → 호출부가 code로 분기(예: BOARD_NOT_FOUND → 404).
 */
export async function getPostDetailPageData(
  postId: number,
  sort: CommentSort,
): Promise<PostDetailPageDataResult> {
  const accessToken = await readSessionToken();

  try {
    const post = await createGetPostDetailUseCase(accessToken).execute(postId);

    // 댓글 목록 조회가 실패해도 게시글 상세는 보이도록 빈 목록으로 폴백(graceful degradation).
    const comments = await createGetCommentsUseCase(accessToken)
      .execute(postId, sort)
      .catch(() => EMPTY_COMMENTS);

    // 게시글 작성자 본인이 단 댓글에 "작성자" 배지를 채운다(응답에 직접 필드가 없어 id 비교로 도출).
    const commentsWithAuthor: CommentList = {
      ...comments,
      items: markPostAuthorComments(comments.items, post.author.userId),
    };

    return { ok: true, data: { post, comments: commentsWithAuthor } };
  } catch (error) {
    const apiError = toApiError(error);
    return {
      ok: false,
      status: apiError.status,
      code: apiError.code,
      error: apiError.message,
    };
  }
}
