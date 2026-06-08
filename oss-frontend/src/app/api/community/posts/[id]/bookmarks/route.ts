import { NextResponse } from "next/server";

import {
  parsePostId,
  requireSessionOr401,
  toErrorResponse,
} from "@/app/api/community/_lib/community-route-helpers";
import { createToggleBookmarkUseCase } from "@/features/community/application/community-use-case-factory";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * 게시글 북마크 BFF (인증 필요).
 *
 * - POST   : 북마크 추가 (현재 미북마크 상태 → bookmark)
 * - DELETE : 북마크 취소 (현재 북마크 상태 → unbookmark)
 */
export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/community/posts/[id]/bookmarks">,
) {
  return mutateBookmark(ctx, false, "bookmark");
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/community/posts/[id]/bookmarks">,
) {
  return mutateBookmark(ctx, true, "unbookmark");
}

async function mutateBookmark(
  ctx: RouteContext<"/api/community/posts/[id]/bookmarks">,
  currentlyBookmarked: boolean,
  context: string,
) {
  const { id } = await ctx.params;
  const parsed = parsePostId(id);
  if ("response" in parsed) return parsed.response;

  const session = await requireSessionOr401();
  if ("response" in session) return session.response;

  try {
    await createToggleBookmarkUseCase(session.accessToken).execute(
      parsed.postId,
      currentlyBookmarked,
    );

    return NextResponse.json<ApiSuccessResponse<null>>(
      { success: true, data: null },
      { status: 200 },
    );
  } catch (error) {
    return toErrorResponse(error, context, "북마크 처리에 실패했습니다.");
  }
}
