import { NextResponse } from "next/server";

import {
  parsePostId,
  requireSessionOr401,
  toErrorResponse,
} from "@/app/api/community/_lib/community-route-helpers";
import { createToggleLikeUseCase } from "@/features/community/application/community-use-case-factory";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * POST /api/community/posts/{id}/likes — 게시글 좋아요 토글(인증 필요).
 *
 * 업스트림 PUT /board/like/{id}로 위임한다(단일 엔드포인트 등록/취소).
 * 응답으로 토글 후 좋아요 상태(liked)를 돌려줘 클라이언트가 낙관적 상태를 보정한다.
 */
export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/community/posts/[id]/likes">,
) {
  const { id } = await ctx.params;
  const parsed = parsePostId(id);
  if ("response" in parsed) return parsed.response;

  const session = await requireSessionOr401();
  if ("response" in session) return session.response;

  try {
    const liked = await createToggleLikeUseCase(session.accessToken).execute(
      parsed.postId,
    );

    return NextResponse.json<ApiSuccessResponse<{ liked: boolean }>>(
      { success: true, data: { liked } },
      { status: 200 },
    );
  } catch (error) {
    return toErrorResponse(error, "like", "좋아요 처리에 실패했습니다.");
  }
}
