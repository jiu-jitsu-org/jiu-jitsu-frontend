import { NextResponse } from "next/server";

import {
  parsePostId,
  requireSessionOr401,
  toErrorResponse,
} from "@/app/api/community/_lib/community-route-helpers";
import { createToggleLikeUseCase } from "@/features/community/application/community-use-case-factory";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * 게시글 좋아요 BFF (인증 필요).
 *
 * - POST   : 좋아요 추가 (현재 미좋아요 상태 → like)
 * - DELETE : 좋아요 취소 (현재 좋아요 상태 → unlike)
 *
 * ToggleLikeUseCase는 "현재 liked" 값을 받아 반대 동작을 수행하므로,
 * REST 의미(POST=add/DELETE=remove)를 현재 상태 boolean으로 매핑해 호출한다.
 */
export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/community/posts/[id]/likes">,
) {
  return mutateLike(ctx, false, "like");
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/community/posts/[id]/likes">,
) {
  return mutateLike(ctx, true, "unlike");
}

async function mutateLike(
  ctx: RouteContext<"/api/community/posts/[id]/likes">,
  currentlyLiked: boolean,
  context: string,
) {
  const { id } = await ctx.params;
  const parsed = parsePostId(id);
  if ("response" in parsed) return parsed.response;

  const session = await requireSessionOr401();
  if ("response" in session) return session.response;

  try {
    await createToggleLikeUseCase(session.accessToken).execute(
      parsed.postId,
      currentlyLiked,
    );

    return NextResponse.json<ApiSuccessResponse<null>>(
      { success: true, data: null },
      { status: 200 },
    );
  } catch (error) {
    return toErrorResponse(error, context, "좋아요 처리에 실패했습니다.");
  }
}
