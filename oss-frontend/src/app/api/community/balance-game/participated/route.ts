import { NextRequest, NextResponse } from "next/server";

import {
  jsonError,
  requireSessionOr401,
  toErrorResponse,
} from "@/app/api/community/_lib/community-route-helpers";
import { isMyBalanceGamesEnabled } from "@/config/env";
import { createGetParticipatedBalanceGamesUseCase } from "@/features/community/application/community-use-case-factory";
import type { BalanceGameList } from "@/features/community/domain/balance-game";
import { FEED_PAGE_SIZE } from "@/features/community/domain/post-summary";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * GET /api/community/balance-game/participated — 내가 참여한 밸런스 게임 다음 페이지 조회(무한 스크롤용).
 *
 * 내가 쓴 글 BFF(GET /api/community/board/mine)와 같은 역할 · 같은 규약이다. 업스트림이 로그인 전용이라
 * 세션이 없으면 401로 막고, 첫 페이지는 Server Component가 직접 application을 호출한다.
 *
 * 업스트림(GET /community/balance-game/participated)이 아직 운영에 배포되지 않아
 * NEXT_PUBLIC_MY_BALANCE_GAMES가 off면 탭과 함께 이 경로도 닫는다(404).
 *
 * 정적 세그먼트라 형제 동적 경로([contentId])보다 먼저 매칭된다.
 */
export async function GET(request: NextRequest) {
  if (!isMyBalanceGamesEnabled()) {
    return jsonError("지원하지 않는 목록입니다.", 404);
  }

  const session = await requireSessionOr401();
  if ("response" in session) return session.response;

  const { searchParams } = request.nextUrl;
  const rawPage = Number(searchParams.get("page"));
  const rawSize = Number(searchParams.get("size"));

  try {
    const data = await createGetParticipatedBalanceGamesUseCase(
      session.accessToken,
    ).execute({
      page: Number.isInteger(rawPage) && rawPage >= 0 ? rawPage : 0,
      size: Number.isInteger(rawSize) && rawSize > 0 ? rawSize : FEED_PAGE_SIZE,
    });

    return NextResponse.json<ApiSuccessResponse<BalanceGameList>>({
      success: true,
      data,
    });
  } catch (error) {
    return toErrorResponse(
      error,
      "my-balance-game-list",
      "밸런스 게임 목록을 불러오지 못했습니다.",
    );
  }
}
