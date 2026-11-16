import { NextResponse } from "next/server";

import {
  parseUserId,
  requireSessionOr401,
  toErrorResponse,
} from "@/app/api/community/_lib/community-route-helpers";
import {
  createBlockUserUseCase,
  createUnblockUserUseCase,
} from "@/features/community/application/community-use-case-factory";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * POST /api/community/users/{id}/block — 유저 차단(인증 필요).
 *
 * 업스트림 POST /user/block/{id}(단일 엔드포인트 차단/차단해제 토글)로 위임한다.
 * 대상은 댓글 id가 아니라 작성자 userId다 — 차단은 회원 단위 동작이라 그 회원의 게시글·댓글
 * 전체가 함께 비노출된다.
 *
 * 이미 차단한 회원이라 토글이 해제로 끝나면 BlockUserUseCase가 한 번 더 토글해 차단으로 돌려놓는다(#488).
 * 응답의 blocked는 그 뒤의 차단 상태다 — 호출부는 true일 때만 차단 완료로 안내한다.
 * 해제(설정 > 차단한 회원)는 토글이 아니라 아래 DELETE를 쓴다.
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

/**
 * DELETE /api/community/users/{id}/block — 차단 해제 전용(인증 필요).
 *
 * 업스트림 DELETE /user/block/{id}로 위임한다. 이미 풀려 있는 회원이어도 성공한다 — 토글과 달리
 * 다른 기기에서 먼저 풀었어도 다시 차단되지 않는다. 업스트림 data가 null이라 성공 여부는 HTTP 상태로만 본다.
 */
export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/community/users/[id]/block">,
) {
  const { id } = await ctx.params;
  const parsed = parseUserId(id);
  if ("response" in parsed) return parsed.response;

  const session = await requireSessionOr401();
  if ("response" in session) return session.response;

  try {
    await createUnblockUserUseCase(session.accessToken).execute(parsed.userId);

    return NextResponse.json<ApiSuccessResponse<null>>(
      { success: true, data: null },
      { status: 200 },
    );
  } catch (error) {
    return toErrorResponse(error, "unblock", "차단 해제에 실패했습니다.");
  }
}
