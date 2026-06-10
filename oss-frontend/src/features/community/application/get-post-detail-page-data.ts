import {
  createGetCommentsUseCase,
  createGetPostDetailUseCase,
} from "@/features/community/application/community-use-case-factory";
import type { CommentList } from "@/features/community/domain/comment";
import type { CommentSort, PostDetail } from "@/features/community/domain/post";
import { readSessionToken } from "@/shared/lib/auth";
import { HttpError } from "@/shared/lib/http";

export type PostDetailPageData = {
  post: PostDetail;
  comments: CommentList;
};

export type PostDetailPageDataResult =
  | { ok: true; data: PostDetailPageData }
  | { ok: false; status: number; error: string; errorDetails?: unknown };

/**
 * 상세 화면 Server Component용 페이지 쿼리.
 *
 * 자체 BFF route로 다시 HTTP 요청하지 않고 application use case를 직접 호출한다.
 * Server Component는 이미 서버에서 실행되므로 내부 네트워크 왕복을 피하면서도
 * Server Component -> Application -> Domain 계약 -> Infrastructure -> HTTP 흐름은 유지한다.
 * (bootstrap의 get-bootstrap-info-page-data 패턴)
 *
 * 세션 토큰이 있으면 함께 넘겨 viewer(liked/bookmarked/isOwner) 상태를 채운다.
 * 비로그인이어도 본문 열람은 가능하다.
 */
export async function getPostDetailPageData(
  postId: number,
  sort: CommentSort,
): Promise<PostDetailPageDataResult> {
  const accessToken = await readSessionToken();

  try {
    const [post, comments] = await Promise.all([
      createGetPostDetailUseCase(accessToken).execute(postId),
      createGetCommentsUseCase(accessToken).execute(postId, sort),
    ]);

    return { ok: true, data: { post, comments } };
  } catch (error) {
    if (error instanceof HttpError) {
      return {
        ok: false,
        status: error.status,
        error: error.message,
        errorDetails: error.body,
      };
    }

    return {
      ok: false,
      status: 500,
      error: "게시글을 불러오는 중 서버 오류가 발생했습니다.",
    };
  }
}
