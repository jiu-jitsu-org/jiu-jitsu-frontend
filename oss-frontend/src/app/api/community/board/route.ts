import { NextRequest, NextResponse } from "next/server";

import {
  isCompetitionEnabled,
  withoutCompetitionWhenDisabled,
} from "@/features/competition/application/is-competition-enabled";
import {
  parsePostBody,
  requireSessionOr401,
  toErrorResponse,
  validatePostBody,
} from "@/app/api/community/_lib/community-route-helpers";
import {
  createCreatePostUseCase,
  createGetPostListUseCase,
} from "@/features/community/application/community-use-case-factory";
import { normalizeSearchKeyword } from "@/features/community/domain/post-search";
import {
  FEED_PAGE_SIZE,
  type BoardListQuery,
  type BoardListType,
  type PostList,
} from "@/features/community/domain/post-summary";
import { readSessionToken } from "@/shared/lib/auth";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * GET /api/community/board — 메인 피드 · 글 검색(#591) 다음 페이지 조회(무한 스크롤용).
 *
 * `boardListType=SEARCH&searchKeyword=`면 글 검색이고, 그 밖은 메인 피드(FEED)다. 검색어가 비면
 * 업스트림을 부르지 않고 빈 페이지를 돌려준다 — 서버도 빈 페이지지만 0건 검색어 기록(#266)에 남지 않게.
 *
 * 초기 목록은 Server Component가 직접 application을 호출하지만, 이후 페이지는 클라이언트가
 * 이 BFF로 요청한다(Browser → app/api → application → infrastructure). 목록 열람은 비로그인도
 * 가능하므로 세션 토큰은 있으면 viewer 상태(liked/bookmarked)를 채우고 없으면 익명 조회한다.
 *
 * 토큰 만료(403 A0003)는 toErrorResponse가 업스트림 body를 details로 실어 내려주므로,
 * 브라우저의 bffFetch가 이를 감지해 네이티브 갱신 후 이 호출만 1회 재시도한다.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const rawPage = Number(searchParams.get("page"));
  const rawSize = Number(searchParams.get("size"));
  const rawCategoryId = Number(searchParams.get("categoryId"));
  const rawCompetitionId = Number(searchParams.get("competitionId"));
  const searchKeyword =
    normalizeSearchKeyword(searchParams.get("searchKeyword") ?? "") ||
    undefined;
  const sort = searchParams.get("sort")?.trim() || undefined;

  // categoryId · competitionId는 양의 정수일 때만 조건으로 넘긴다(없으면 전체 피드).
  const categoryId =
    Number.isInteger(rawCategoryId) && rawCategoryId > 0
      ? rawCategoryId
      : undefined;
  // 이 대회 글만(#598, backend#269). 대회 화면이 꺼진 배포에서는 받지 않는다.
  const competitionId =
    isCompetitionEnabled() &&
    Number.isInteger(rawCompetitionId) &&
    rawCompetitionId > 0
      ? rawCompetitionId
      : undefined;

  // 카테고리 탭(#590)은 CATEGORY + categoryId, 글 검색(#591)은 SEARCH, 그 밖에는 FEED.
  const requestedListType = searchParams.get("boardListType");
  const boardListType: BoardListType =
    requestedListType === "SEARCH"
      ? "SEARCH"
      : requestedListType === "CATEGORY" && categoryId
        ? "CATEGORY"
        : "FEED";

  const query: BoardListQuery = {
    boardListType,
    page: Number.isInteger(rawPage) && rawPage >= 0 ? rawPage : 0,
    size: Number.isInteger(rawSize) && rawSize > 0 ? rawSize : FEED_PAGE_SIZE,
    categoryId,
    competitionId,
    searchKeyword,
    sort,
  };

  if (boardListType === "SEARCH" && !searchKeyword) {
    return NextResponse.json<ApiSuccessResponse<PostList>>({
      success: true,
      data: emptyPostList(query),
    });
  }

  const accessToken = await readSessionToken();

  try {
    // 고른 대회 카드(#379)는 목록 응답에 실려 온다. 대회 화면이 꺼진 배포에서는 뗀다.
    const list = await createGetPostListUseCase(accessToken).execute(query);
    const data: PostList = {
      ...list,
      items: withoutCompetitionWhenDisabled(list.items),
    };

    return NextResponse.json<ApiSuccessResponse<PostList>>({
      success: true,
      data,
    });
  } catch (error) {
    return toErrorResponse(
      error,
      "board-list",
      "게시글을 불러오지 못했습니다.",
    );
  }
}

/** 빈 검색어의 결과 — 요청한 페이지 그대로 0건 · 마지막 페이지. */
function emptyPostList(query: BoardListQuery): PostList {
  return {
    items: [],
    page: query.page,
    size: query.size,
    totalElements: 0,
    totalPages: 0,
    isLast: true,
  };
}

/**
 * POST /api/community/board — 게시글 생성(④, 인증 필요).
 *
 * body: { categoryId: number, title: string, body: string, imageFileIdList: number[], tags: string[], competitionId?: number }
 * imageFileIdList는 등록(③) 단계에서 받은 TEMP 이미지의 서버 int id 목록(표시 순서 = 저장 순서).
 * tags는 태그 이름 목록 — 화면이 정규화(허용 문자·소문자·중복 제거)한 값이지만 서버도 한 번 더 정리한다.
 */
export async function POST(request: NextRequest) {
  const session = await requireSessionOr401();
  if ("response" in session) return session.response;

  const fields = await parsePostBody(request);
  const invalid = validatePostBody(fields);
  if (invalid) return invalid;

  try {
    const data = await createCreatePostUseCase(session.accessToken).execute(
      fields,
    );

    // 201 = 생성 성공(표준). 생성된 게시글 id를 남겨 추가 여부를 서버 로그로 확인.
    console.info("[community:post-create] 생성 성공 id:", data?.id, data);

    return NextResponse.json<ApiSuccessResponse<typeof data>>(
      { success: true, data },
      { status: 201 },
    );
  } catch (error) {
    return toErrorResponse(error, "post-create", "게시글 작성에 실패했습니다.");
  }
}
