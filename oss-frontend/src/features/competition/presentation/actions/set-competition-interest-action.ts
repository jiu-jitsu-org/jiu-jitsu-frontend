"use server";

import { createSetCompetitionInterestUseCase } from "@/features/competition/application/competition-use-case-factory";
import { readSessionToken } from "@/shared/lib/auth";

export type SetCompetitionInterestResult =
  | { ok: true; count: number }
  | { ok: false; reason: "unauthenticated" | "failed" };

/**
 * 대회 관심 등록·해제 Server Action (#335).
 *
 * 화면은 누르는 순간 먼저 바꿔 보여 주고(낙관적), 이 결과로 관심 수를 맞추거나 실패면 되돌린다.
 * 클라이언트의 로그인 확인은 안내용이고, 실제 경계는 여기서 다시 보는 세션이다.
 */
export async function setCompetitionInterestAction(
  competitionId: string,
  interested: boolean,
): Promise<SetCompetitionInterestResult> {
  if (typeof competitionId !== "string" || competitionId.length === 0) {
    return { ok: false, reason: "failed" };
  }
  if ((await readSessionToken()) === null) {
    return { ok: false, reason: "unauthenticated" };
  }

  try {
    const count = await createSetCompetitionInterestUseCase().execute(
      competitionId,
      interested === true,
    );
    return { ok: true, count };
  } catch {
    return { ok: false, reason: "failed" };
  }
}
