import { NextResponse } from "next/server";

import {
  jsonError,
  parseContentId,
  requireSessionOr401,
  toErrorResponse,
} from "@/app/api/community/_lib/community-route-helpers";
import { createVoteBalanceGameUseCase } from "@/features/community/application/community-use-case-factory";
import type {
  BalanceGame,
  BalanceOptionKey,
} from "@/features/community/domain/balance-game";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * POST /api/community/balance-game/{contentId}/vote — 밸런스 게임 투표(인증 필요).
 *
 * body: { option: "A" | "B" }
 * 업스트림이 투표를 반영한 최신 전체 상태를 돌려주므로 그대로 내려보낸다 — 클라이언트는
 * 응답으로 낙관적 상태를 덮어쓰기만 하면 되고 재조회하지 않는다.
 *
 * 주의: 업스트림은 이미 투표한 선택지를 다시 받으면 **취소**로 처리한다. "재투표 불가"는
 * 화면 정책이라 여기서 막지 않는다(presentation의 투표 훅이 게이트를 갖는다). 이 route는
 * 들어온 요청을 그대로 위임하며, 마감된 게임(400 C0007)도 업스트림 판정을 그대로 전달한다.
 */

/** 업스트림이 받는 선택지 값. body 검증의 단일 출처. */
const VALID_OPTIONS: readonly BalanceOptionKey[] = ["A", "B"];

function isBalanceOptionKey(value: unknown): value is BalanceOptionKey {
  return VALID_OPTIONS.includes(value as BalanceOptionKey);
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/community/balance-game/[contentId]/vote">,
) {
  const { contentId } = await ctx.params;
  const parsed = parseContentId(contentId);
  if ("response" in parsed) return parsed.response;

  const session = await requireSessionOr401();
  if ("response" in session) return session.response;

  let option: unknown;
  try {
    const json = await request.json();
    option = json?.option;
  } catch {
    // 파싱 실패는 아래 검증에서 400으로 처리된다.
  }

  if (!isBalanceOptionKey(option)) {
    return jsonError("유효한 선택지가 아닙니다.", 400);
  }

  try {
    const data = await createVoteBalanceGameUseCase(
      session.accessToken,
    ).execute(parsed.contentId, option);

    return NextResponse.json<ApiSuccessResponse<BalanceGame>>(
      { success: true, data },
      { status: 200 },
    );
  } catch (error) {
    return toErrorResponse(
      error,
      "balance-game-vote",
      "투표에 실패했습니다.",
    );
  }
}
