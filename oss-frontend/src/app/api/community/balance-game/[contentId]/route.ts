import { NextResponse } from "next/server";

import {
  jsonError,
  parseContentId,
  toErrorResponse,
} from "@/app/api/community/_lib/community-route-helpers";
import { createGetBalanceGameDetailUseCase } from "@/features/community/application/community-use-case-factory";
import type { BalanceGame } from "@/features/community/domain/balance-game";
import { readSessionToken } from "@/shared/lib/auth";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * GET /api/community/balance-game/{contentId} — 밸런스 게임 단건 조회.
 *
 * 초기 조회는 Server Component가 application을 직접 호출하지만(get-balance-detail-page-data),
 * 상세 화면이 살아 있는 동안의 갱신(마감 전환·포그라운드 복귀)은 클라이언트가 이 BFF로 요청한다.
 *
 * 오늘의 게임(`/api/community/balance-game`)과 달리 **마감된 판도 그대로 돌려준다** — 상세를
 * 보던 중 마감돼도 그 자리에 머물러야 한다는 정책이 이 구분에 기대고 있다.
 *
 * 열람은 비로그인도 가능하므로 세션 토큰은 있으면 부착해 myVote·isLiked를 채우고, 없으면
 * 익명 조회한다. 오늘의 게임 route와 같은 규약이다.
 *
 * 없는 컨텐츠는 **404**로 내려보낸다. 오늘의 게임이 `data: null`을 정상 응답으로 쓰는 것과
 * 다른 이유: 그쪽의 null은 "지금은 판이 없다"라서 카드만 감추면 되지만, 여기서는 사용자가
 * 특정 판을 지목해 들어온 것이라 "그 판이 없다"는 실패다.
 */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/community/balance-game/[contentId]">,
) {
  const { contentId } = await ctx.params;
  const parsed = parseContentId(contentId);
  if ("response" in parsed) return parsed.response;

  const accessToken = await readSessionToken();

  try {
    const data = await createGetBalanceGameDetailUseCase(accessToken).execute(
      parsed.contentId,
    );

    if (!data) {
      return jsonError("밸런스 게임을 찾을 수 없습니다.", 404);
    }

    return NextResponse.json<ApiSuccessResponse<BalanceGame>>({
      success: true,
      data,
    });
  } catch (error) {
    return toErrorResponse(
      error,
      "balance-game-detail",
      "밸런스 게임을 불러오지 못했습니다.",
    );
  }
}
