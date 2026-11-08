import { NextResponse } from "next/server";

import {
  parseCommentId,
  requireSessionOr401,
  toErrorResponse,
} from "@/app/api/community/_lib/community-route-helpers";
import { createRestoreCommentUseCase } from "@/features/community/application/community-use-case-factory";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * PUT /api/community/comments/{id}/restore — 삭제한 댓글 복구(인증 필요).
 *
 * 업스트림 PUT /community/comments/{id}/restore로 위임한다. 본인 댓글 권한과 복구 가능
 * 시간은 업스트림이 최종 검사한다 — 만료면 400 C0008, 타인 댓글이면 403 U0003이 그대로
 * 내려오고(toErrorResponse가 details.code로 실어 보냄), 이미 복구된 댓글은 성공으로 돌려준다.
 */
export async function PUT(
  _request: Request,
  ctx: RouteContext<"/api/community/comments/[id]/restore">,
) {
  const { id } = await ctx.params;
  const parsed = parseCommentId(id);
  if ("response" in parsed) return parsed.response;

  const session = await requireSessionOr401();
  if ("response" in session) return session.response;

  try {
    await createRestoreCommentUseCase(session.accessToken).execute(
      parsed.commentId,
    );

    return NextResponse.json<ApiSuccessResponse<null>>(
      { success: true, data: null },
      { status: 200 },
    );
  } catch (error) {
    return toErrorResponse(error, "comment-restore", "댓글 복구에 실패했습니다.");
  }
}
