import { createGetPostListUseCase } from "@/features/community/application/community-use-case-factory";
import type {
  BoardListQuery,
  PostList,
} from "@/features/community/domain/post-summary";
import { readSessionToken } from "@/shared/lib/auth";
import { ApiError, ApiErrorCode, toApiError } from "@/shared/lib/http";

export type BoardListPageData = {
  list: PostList;
};

export type BoardListPageDataResult =
  | { ok: true; data: BoardListPageData }
  // 만료 토큰 — 서버는 갱신 불가하니 클라이언트가 네이티브 갱신 후 인증 상태로 재조회한다.
  | { ok: false; reason: "session-expired" }
  | { ok: false; reason: "error"; status: number; code: string; error: string };

/**
 * 메인 피드 Server Component용 페이지 쿼리.
 *
 * 자체 BFF route로 다시 HTTP 요청하지 않고 application use case를 직접 호출한다.
 * Server Component -> Application -> Domain 계약 -> Infrastructure -> HTTP 흐름은 유지한다.
 * (상세의 get-post-detail-page-data 패턴과 동일)
 *
 * 세션 토큰이 있으면 함께 넘겨 각 게시글의 viewer(liked/bookmarked/commented) 상태를 채운다
 * (비로그인도 목록 열람 가능). 에러는 공통 ApiError로 정규화해 호출부가 분기한다.
 *
 * 만료 토큰(A0003) 처리: 서버 컴포넌트는 네이티브 Keychain의 refreshToken에 접근할 수 없어
 * 토큰을 스스로 갱신할 수 없다. 그렇다고 익명으로 격하하면 네이티브(로그인)와 웹(비로그인)
 * 세션이 어긋나므로, "session-expired"만 알리고 실제 조회는 클라이언트로 위임한다. 클라이언트는
 * bffFetch로 다시 조회하면서 A0003을 네이티브 갱신·재시도로 복구해 인증 상태로 목록을 채운다.
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

    // 로그인 상태(토큰 있음)에서 토큰 만료 → 클라이언트가 네이티브 갱신 후 재조회하도록 위임.
    if (accessToken && apiError.code === ApiErrorCode.EXPIRED_TOKEN) {
      return { ok: false, reason: "session-expired" };
    }

    return toFailure(apiError);
  }
}

/** ApiError를 페이지 실패 상태로 변환하고, 실제 원인을 서버 로그에 남긴다. */
function toFailure(apiError: ApiError): BoardListPageDataResult {
  // 초기 피드가 에러 상태(FeedErrorState)로 떨어진 실제 원인을 서버 로그에 남긴다.
  // (쓰기 route의 toErrorResponse와 대칭 — 조용히 삼키면 디버깅이 불가능하다.)
  console.error(
    "[community:board-list-page] 초기 목록 조회 실패:",
    apiError.status,
    apiError.code,
    apiError.message,
  );

  return {
    ok: false,
    reason: "error",
    status: apiError.status,
    code: apiError.code,
    error: apiError.message,
  };
}
