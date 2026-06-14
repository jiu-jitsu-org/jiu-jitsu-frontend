import { NextResponse } from "next/server";

import {
  parseCommentId,
  requireSessionOr401,
  toErrorResponse,
} from "@/app/api/community/_lib/community-route-helpers";
import { createDeleteCommentUseCase } from "@/features/community/application/community-use-case-factory";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * DELETE /api/community/comments/{id} — 댓글 삭제(인증 필요).
 *
 * 업스트림 DELETE /community/comments/{id}로 위임. 본인 댓글 권한은 업스트림이 최종 검사한다.
 */
export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/community/comments/[id]">,
) {
  const { id } = await ctx.params;
  const parsed = parseCommentId(id);
  if ("response" in parsed) return parsed.response;

  const session = await requireSessionOr401();
  if ("response" in session) return session.response;

  try {
    await createDeleteCommentUseCase(session.accessToken).execute(
      parsed.commentId,
    );

    return NextResponse.json<ApiSuccessResponse<null>>(
      { success: true, data: null },
      { status: 200 },
    );
  } catch (error) {
    return toErrorResponse(error, "comment-delete", "댓글 삭제에 실패했습니다.");
  }
}
