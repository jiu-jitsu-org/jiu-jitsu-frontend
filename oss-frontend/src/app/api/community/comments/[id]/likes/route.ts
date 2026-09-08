import { NextResponse } from "next/server";

import {
  parseCommentId,
  requireSessionOr401,
  toErrorResponse,
} from "@/app/api/community/_lib/community-route-helpers";
import { createToggleCommentLikeUseCase } from "@/features/community/application/community-use-case-factory";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * POST /api/community/comments/{id}/likes — 댓글 좋아요 토글(인증 필요).
 *
 * 업스트림 POST /community/comments/like({commentId})로 위임한다(단일 엔드포인트 등록/취소).
 * 응답으로 토글 후 좋아요 상태(liked)와 서버가 계산한 좋아요 수(likeCount)를 돌려줘
 * 클라이언트가 낙관적 상태와 카운트를 서버 값으로 확정한다.
 */
export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/community/comments/[id]/likes">,
) {
  const { id } = await ctx.params;
  const parsed = parseCommentId(id);
  if ("response" in parsed) return parsed.response;

  const session = await requireSessionOr401();
  if ("response" in session) return session.response;

  try {
    const { liked, likeCount } = await createToggleCommentLikeUseCase(
      session.accessToken,
    ).execute(parsed.commentId);

    // likeCount가 없는 구버전 응답에서는 키 자체를 빼서, 클라이언트가 로컬 계산으로 폴백하게 둔다.
    return NextResponse.json<
      ApiSuccessResponse<{ liked: boolean; likeCount?: number }>
    >(
      {
        success: true,
        data: typeof likeCount === "number" ? { liked, likeCount } : { liked },
      },
      { status: 200 },
    );
  } catch (error) {
    return toErrorResponse(
      error,
      "comment-like",
      "댓글 좋아요 처리에 실패했습니다.",
    );
  }
}
