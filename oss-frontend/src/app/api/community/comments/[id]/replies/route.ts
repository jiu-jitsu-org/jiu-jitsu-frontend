import { NextResponse, type NextRequest } from "next/server";

import {
  jsonError,
  parseCommentId,
  toErrorResponse,
} from "@/app/api/community/_lib/community-route-helpers";
import { createGetRepliesUseCase } from "@/features/community/application/community-use-case-factory";
import { normalizeCommentSort } from "@/features/community/domain/post";
import { readSessionToken } from "@/shared/lib/auth";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * GET /api/community/comments/{id}/replies — 부모 댓글의 대댓글 추가 조회(「대댓글 더보기」).
 *
 * query: page(0부터) · sort(latest|oldest)
 *
 * 세션을 강제하지 않는다 — 댓글은 비로그인도 열람하는 읽기라, 토큰이 있으면 viewer 상태
 * (isLiked·isAuthor)까지 채워지고 없으면 익명 조회로 내려간다(상세 SSR과 같은 규칙).
 *
 * sort를 반드시 함께 보낸다: 업스트림은 sortType이 없으면 등록순으로 처리해서, 최신순으로
 * 보던 중 더보기를 누르면 순서가 뒤집힌 목록이 뒤에 붙는다.
 */
export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/community/comments/[id]/replies">,
) {
  const { id } = await ctx.params;
  const parsed = parseCommentId(id);
  if ("response" in parsed) return parsed.response;

  const page = Number(request.nextUrl.searchParams.get("page") ?? 0);
  if (!Number.isInteger(page) || page < 0) {
    return jsonError("잘못된 페이지 번호입니다.", 400);
  }

  const sort = normalizeCommentSort(
    request.nextUrl.searchParams.get("sort") ?? undefined,
  );

  const accessToken = await readSessionToken();

  try {
    const data = await createGetRepliesUseCase(accessToken).execute(
      parsed.commentId,
      sort,
      page,
    );

    return NextResponse.json<ApiSuccessResponse<typeof data>>(
      { success: true, data },
      { status: 200 },
    );
  } catch (error) {
    return toErrorResponse(
      error,
      "comment-replies",
      "대댓글을 불러오지 못했습니다.",
    );
  }
}
