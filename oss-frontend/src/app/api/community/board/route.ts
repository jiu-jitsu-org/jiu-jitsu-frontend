import { NextRequest, NextResponse } from "next/server";

import {
  jsonError,
  requireSessionOr401,
  toErrorResponse,
} from "@/app/api/community/_lib/community-route-helpers";
import {
  createCreatePostUseCase,
  createGetPostListUseCase,
} from "@/features/community/application/community-use-case-factory";
import {
  FEED_PAGE_SIZE,
  type BoardListQuery,
  type PostList,
} from "@/features/community/domain/post-summary";
import { readSessionToken } from "@/shared/lib/auth";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * GET /api/community/board — 메인 피드 다음 페이지 조회(무한 스크롤용).
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
  const searchKeyword = searchParams.get("searchKeyword")?.trim() || undefined;
  const sort = searchParams.get("sort")?.trim() || undefined;

  const query: BoardListQuery = {
    boardListType: "FEED",
    page: Number.isInteger(rawPage) && rawPage >= 0 ? rawPage : 0,
    size: Number.isInteger(rawSize) && rawSize > 0 ? rawSize : FEED_PAGE_SIZE,
    // categoryId는 양의 정수일 때만 필터로 넘긴다(없으면 전체 피드).
    categoryId:
      Number.isInteger(rawCategoryId) && rawCategoryId > 0
        ? rawCategoryId
        : undefined,
    searchKeyword,
    sort,
  };

  const accessToken = await readSessionToken();

  try {
    const data = await createGetPostListUseCase(accessToken).execute(query);

    return NextResponse.json<ApiSuccessResponse<PostList>>({
      success: true,
      data,
    });
  } catch (error) {
    return toErrorResponse(error, "board-list", "게시글을 불러오지 못했습니다.");
  }
}

/**
 * POST /api/community/board — 게시글 생성(④, 인증 필요).
 *
 * body: { categoryId: number, title: string, body: string, imageFileIdList: number[] }
 * imageFileIdList는 등록(③) 단계에서 받은 TEMP 이미지의 서버 int id 목록(표시 순서 = 저장 순서).
 */
export async function POST(request: NextRequest) {
  const session = await requireSessionOr401();
  if ("response" in session) return session.response;

  let categoryId = NaN;
  let title = "";
  let body = "";
  let imageFileIdList: number[] = [];
  try {
    const json = await request.json();
    categoryId = Number(json?.categoryId);
    title = String(json?.title ?? "").trim();
    body = String(json?.body ?? "").trim();
    // 정수 id만 통과(잘못된 항목은 제거). 미첨부면 빈 배열.
    imageFileIdList = Array.isArray(json?.imageFileIdList)
      ? json.imageFileIdList.map(Number).filter(Number.isInteger)
      : [];
  } catch {
    // 파싱 실패는 아래 검증에서 400으로 처리된다.
  }

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return jsonError("유효한 카테고리를 선택해 주세요.", 400);
  }
  if (!title || !body) {
    return jsonError("제목과 내용을 모두 입력해 주세요.", 400);
  }

  try {
    const data = await createCreatePostUseCase(session.accessToken).execute({
      categoryId,
      title,
      body,
      imageFileIdList,
    });

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
