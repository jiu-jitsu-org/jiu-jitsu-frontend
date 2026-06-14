import { createGetPostListUseCase } from "@/features/community/application/community-use-case-factory";
import type {
  BoardListQuery,
  PostList,
} from "@/features/community/domain/post-summary";
import { readSessionToken } from "@/shared/lib/auth";
import { toApiError } from "@/shared/lib/http";

export type BoardListPageData = {
  list: PostList;
};

export type BoardListPageDataResult =
  | { ok: true; data: BoardListPageData }
  | { ok: false; status: number; code: string; error: string };

/**
 * 메인 피드 Server Component용 페이지 쿼리.
 *
 * 자체 BFF route로 다시 HTTP 요청하지 않고 application use case를 직접 호출한다.
 * Server Component -> Application -> Domain 계약 -> Infrastructure -> HTTP 흐름은 유지한다.
 * (상세의 get-post-detail-page-data 패턴과 동일)
 *
 * 세션 토큰이 있으면 함께 넘겨 각 게시글의 viewer(liked/bookmarked/commented) 상태를 채운다
 * (비로그인도 목록 열람 가능). 에러는 공통 ApiError로 정규화해 호출부가 분기한다.
 */
export async function getBoardListPageData(
  query: BoardListQuery,
): Promise<BoardListPageDataResult> {
  const accessToken = await readSessionToken();

  try {
    const list = await createGetPostListUseCase(accessToken).execute(query);
    return { ok: true, data: { list } };
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
