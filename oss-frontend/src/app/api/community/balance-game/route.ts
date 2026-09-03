import { NextResponse } from "next/server";

import { toErrorResponse } from "@/app/api/community/_lib/community-route-helpers";
import { createGetCurrentBalanceGameUseCase } from "@/features/community/application/community-use-case-factory";
import type { BalanceGame } from "@/features/community/domain/balance-game";
import { readSessionToken } from "@/shared/lib/auth";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * GET /api/community/balance-game — 오늘의 밸런스 게임 조회.
 *
 * 초기 조회는 Server Component가 application을 직접 호출하지만(get-balance-game-page-data),
 * 이후 갱신(마감 도달 · 포그라운드 복귀 · 상세에서 복귀)은 클라이언트가 이 BFF로 요청한다.
 *
 * 열람은 비로그인도 가능하므로 세션 토큰은 있으면 부착해 myVote를 채우고, 없으면 익명 조회한다.
 * 토큰 만료(403 A0003)는 toErrorResponse가 업스트림 body를 details로 실어 내려주므로,
 * 브라우저의 bffFetch가 이를 감지해 네이티브 갱신 후 이 호출만 1회 재시도한다.
 *
 * 진행 중인 게임이 없으면 data가 null이다 — 에러가 아니라 정상 응답이고, 화면은 조회 실패와
 * 같은 모습(카드 미노출)으로 처리한다.
 */
export async function GET() {
  const accessToken = await readSessionToken();

  try {
    const data = await createGetCurrentBalanceGameUseCase(
      accessToken,
    ).execute();

    return NextResponse.json<ApiSuccessResponse<BalanceGame | null>>({
      success: true,
      data,
    });
  } catch (error) {
    return toErrorResponse(
      error,
      "balance-game",
      "밸런스 게임을 불러오지 못했습니다.",
    );
  }
}
