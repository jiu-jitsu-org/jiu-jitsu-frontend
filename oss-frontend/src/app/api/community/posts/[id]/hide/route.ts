import { NextResponse } from "next/server";

import {
  parsePostId,
  requireSessionOr401,
  toErrorResponse,
} from "@/app/api/community/_lib/community-route-helpers";
import { createToggleHideUseCase } from "@/features/community/application/community-use-case-factory";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * POST /api/community/posts/{id}/hide — 게시글 숨김 토글(인증 필요).
 *
 * 업스트림 PUT /board/hide/{id}로 위임한다(단일 엔드포인트 숨김/숨김해제).
 * 응답으로 토글 후 숨김 상태(hidden)를 돌려줘, 클라이언트가 "되돌리기"에서 같은 호출로
 * 숨김을 해제했는지 확인할 수 있게 한다.
 */
export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/community/posts/[id]/hide">,
) {
  const { id } = await ctx.params;
  const parsed = parsePostId(id);
  if ("response" in parsed) return parsed.response;

  const session = await requireSessionOr401();
  if ("response" in session) return session.response;

  try {
    const hidden = await createToggleHideUseCase(session.accessToken).execute(
      parsed.postId,
    );

    return NextResponse.json<ApiSuccessResponse<{ hidden: boolean }>>(
      { success: true, data: { hidden } },
      { status: 200 },
    );
  } catch (error) {
    return toErrorResponse(error, "hide", "숨김 처리에 실패했습니다.");
  }
}
