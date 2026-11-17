import { NextResponse } from "next/server";

import {
  parseContentId,
  toErrorResponse,
} from "@/app/api/community/_lib/community-route-helpers";
import { createRecordBalanceGameViewUseCase } from "@/features/community/application/community-use-case-factory";
import { readSessionToken } from "@/shared/lib/auth";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * POST /api/community/balance-game/{contentId}/views — 밸런스 게임 상세를 사람이 연 것으로 센다(#523).
 *
 * 업스트림 POST /community/balance-game/{contentId}/views로 위임하고 센 뒤 조회수(viewCount)를 돌려준다.
 * 상세 조회(GET)는 마감 전환 · 포그라운드 복귀 · 투표 뒤에도 다시 불려 조회수를 올리지 않는다.
 * 비로그인도 센다(같은 사람의 재진입도 방문마다 셈, #124).
 */
export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/community/balance-game/[contentId]/views">,
) {
  const { contentId } = await ctx.params;
  const parsed = parseContentId(contentId);
  if ("response" in parsed) return parsed.response;

  const accessToken = await readSessionToken();

  try {
    const viewCount = await createRecordBalanceGameViewUseCase(
      accessToken,
    ).execute(parsed.contentId);
    return NextResponse.json<ApiSuccessResponse<{ viewCount: number }>>({
      success: true,
      data: { viewCount },
    });
  } catch (error) {
    return toErrorResponse(
      error,
      "balance-game-view",
      "조회수를 세지 못했습니다.",
    );
  }
}
