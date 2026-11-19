import { NextResponse } from "next/server";

import {
  requireSessionOr401,
  toErrorResponse,
} from "@/app/api/community/_lib/community-route-helpers";
import { createGetMyRecordedCompetitionIdsUseCase } from "@/features/community/application/community-use-case-factory";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * GET /api/community/profile/competitions — 내 대회 기록에 걸린 대회 id(인증 필요, #545).
 *
 * 앱이 기록 저장을 알리면(COMPETITION_RECORD_SAVED · PROFILE_UPDATED) 떠 있는 결과 남기기 배너 · 카드가 다시 확인한다.
 * 대회 이름을 직접 입력한 기록은 id가 없어 빠진다.
 */
export async function GET() {
  const session = await requireSessionOr401();
  if ("response" in session) return session.response;

  try {
    const competitionIds = await createGetMyRecordedCompetitionIdsUseCase(
      session.accessToken,
    ).execute();

    return NextResponse.json<ApiSuccessResponse<{ competitionIds: number[] }>>({
      success: true,
      data: { competitionIds },
    });
  } catch (error) {
    return toErrorResponse(
      error,
      "competition-records-get",
      "대회 기록을 불러오지 못했습니다.",
    );
  }
}
