"use server";

import { isCompetitionEnabled } from "@/features/competition/application/is-competition-enabled";
import { createSetCompetitionInterestUseCase } from "@/features/competition/application/competition-use-case-factory";
import { isCompetitionId } from "@/features/competition/domain/competition";
import {
  competitionActionFailure,
  type CompetitionActionFailureReason,
} from "@/features/competition/presentation/actions/competition-action-failure";
import { readSessionToken } from "@/shared/lib/auth";

export type SetCompetitionInterestResult =
  | { ok: true; interested: boolean; interestCount: number }
  | { ok: false; reason: CompetitionActionFailureReason };

/**
 * 대회 관심 등록·해제 Server Action (#335 · #419) — PUT/DELETE /competitions/{id}/interest.
 *
 * 화면은 누르는 순간 먼저 바꿔 보여 주고(낙관적), 이 결과로 관심 수를 맞추거나 실패면 되돌린다.
 * 클라이언트의 로그인 확인은 안내용이고, 실제 경계는 여기서 다시 보는 세션이다.
 */
export async function setCompetitionInterestAction(
  competitionId: number,
  interested: boolean,
): Promise<SetCompetitionInterestResult> {
  // 화면 밖에서도 부를 수 있는 입구라 타입부터 다시 본다.
  if (
    !isCompetitionEnabled() ||
    !isCompetitionId(competitionId) ||
    typeof interested !== "boolean"
  ) {
    return { ok: false, reason: "failed" };
  }
  const accessToken = await readSessionToken();
  if (accessToken === null) return { ok: false, reason: "unauthenticated" };

  try {
    const result = await createSetCompetitionInterestUseCase(
      accessToken,
    ).execute(competitionId, interested);
    return { ok: true, ...result };
  } catch (error) {
    return { ok: false, reason: competitionActionFailure(error) };
  }
}
