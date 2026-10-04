import { NextRequest, NextResponse } from "next/server";

import {
  jsonError,
  requireSessionOr401,
  toErrorResponse,
} from "@/app/api/community/_lib/community-route-helpers";
import { createGetMyPostListUseCase } from "@/features/community/application/community-use-case-factory";
import {
  FEED_PAGE_SIZE,
  parseMyPostListKind,
  type PostList,
} from "@/features/community/domain/post-summary";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * GET /api/community/board/mine?kind=written|saved — 내 커뮤니티 활동 다음 페이지 조회(무한 스크롤용).
 *
 * 메인 피드 BFF(GET /api/community/board)와 같은 역할이되, 업스트림(GET /board/write · /board/save)이
 * 로그인 전용이라 세션이 없으면 401로 막는다. 첫 페이지는 Server Component가 직접 application을 호출한다.
 *
 * 토큰 만료(403 A0003)는 toErrorResponse가 업스트림 body를 details로 실어 내려주므로,
 * 브라우저의 bffFetch가 이를 감지해 네이티브 갱신 후 이 호출만 1회 재시도한다.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const kind = parseMyPostListKind(searchParams.get("kind"));
  if (!kind) return jsonError("잘못된 목록 종류입니다.", 400);

  const session = await requireSessionOr401();
  if ("response" in session) return session.response;

  const rawPage = Number(searchParams.get("page"));
  const rawSize = Number(searchParams.get("size"));
  const sort = searchParams.get("sort")?.trim() || undefined;

  try {
    const data = await createGetMyPostListUseCase(session.accessToken).execute({
      kind,
      page: Number.isInteger(rawPage) && rawPage >= 0 ? rawPage : 0,
      size: Number.isInteger(rawSize) && rawSize > 0 ? rawSize : FEED_PAGE_SIZE,
      sort,
    });

    return NextResponse.json<ApiSuccessResponse<PostList>>({
      success: true,
      data,
    });
  } catch (error) {
    return toErrorResponse(
      error,
      "my-board-list",
      "게시글을 불러오지 못했습니다.",
    );
  }
}
