import { NextResponse } from "next/server";

import {
  parseUserId,
  requireSessionOr401,
  toErrorResponse,
} from "@/app/api/community/_lib/community-route-helpers";
import { createBlockUserUseCase } from "@/features/community/application/community-use-case-factory";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * POST /api/community/users/{id}/block — 유저 차단 토글(인증 필요).
 *
 * 업스트림 POST /user/block/{id}로 위임한다(단일 엔드포인트 차단/차단해제).
 * 대상은 댓글 id가 아니라 작성자 userId다 — 차단은 회원 단위 동작이라 그 회원의 게시글·댓글
 * 전체가 함께 비노출된다.
 *
 * 응답으로 토글 후 차단 상태(blocked)를 돌려준다. 호출부(댓글 ⋮ 차단)는 항상 "차단"만
 * 의도하지만 업스트림이 토글이라, 이미 차단된 유저면 해제될 수 있다. 그 구분이 필요한
 * 화면(설정 > 차단 회원 관리)이 같은 라우트를 그대로 쓸 수 있게 상태를 숨기지 않는다.
 */
export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/community/users/[id]/block">,
) {
  const { id } = await ctx.params;
  const parsed = parseUserId(id);
  if ("response" in parsed) return parsed.response;

  const session = await requireSessionOr401();
  if ("response" in session) return session.response;

  try {
    const blocked = await createBlockUserUseCase(session.accessToken).execute(
      parsed.userId,
    );

    return NextResponse.json<ApiSuccessResponse<{ blocked: boolean }>>(
      { success: true, data: { blocked } },
      { status: 200 },
    );
  } catch (error) {
    return toErrorResponse(error, "block", "차단 처리에 실패했습니다.");
  }
}
