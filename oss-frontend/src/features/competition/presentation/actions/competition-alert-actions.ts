"use server";

import { isCompetitionEnabled } from "@/features/competition/application/is-competition-enabled";
import {
  createAnswerCompetitionAlertPromptUseCase,
  createSetCompetitionNoticeUseCase,
} from "@/features/competition/application/competition-use-case-factory";
import { isCompetitionId } from "@/features/competition/domain/competition";
import {
  competitionActionFailure,
  type CompetitionActionFailureReason,
} from "@/features/competition/presentation/actions/competition-action-failure";
import type { CompetitionNoticeResult } from "@/features/competition/domain/competition-alert";
import { readSessionToken } from "@/shared/lib/auth";

type Failure = { ok: false; reason: CompetitionActionFailureReason };

/**
 * 관심 대회 마감 알림 Server Action (#375~#377 · #422).
 *
 * 화면은 누르는 순간 먼저 바꿔 보여 주고(낙관적), 실패면 되돌린다. 실제 로그인 경계는 여기서 다시 보는 세션이다.
 */
async function run<T>(
  task: (accessToken: string) => Promise<T>,
): Promise<({ ok: true } & T) | Failure> {
  // 대회 화면이 꺼진 배포에서는 부르지 않는다.
  if (!isCompetitionEnabled()) return { ok: false, reason: "failed" };
  const accessToken = await readSessionToken();
  if (accessToken === null) return { ok: false, reason: "unauthenticated" };
  try {
    return { ok: true, ...(await task(accessToken)) };
  } catch (error) {
    return { ok: false, reason: competitionActionFailure(error) };
  }
}

/**
 * 첫 관심 등록 시트의 답(#375) — PUT /notice/setting/competition { enabled }.
 * '나중에'도 false로 부른다 — 설정은 그대로 두고 물어본 것만 남는다.
 */
export async function answerCompetitionAlertPromptAction(
  enabled: boolean,
): Promise<{ ok: true } | Failure> {
  if (typeof enabled !== "boolean") return { ok: false, reason: "failed" };
  return run(async (accessToken) => {
    await createAnswerCompetitionAlertPromptUseCase(accessToken).execute(
      enabled,
    );
    return {};
  });
}

/**
 * 이 대회 알림 켜기·끄기 — 대회 상세 종(#376)·알림함 '이 대회 알림 받지 않기'(#377).
 * 켜면 관심도 함께 등록되므로 돌려주는 관심 상태로 화면을 맞춘다.
 */
export async function setCompetitionNoticeAction(
  competitionId: number,
  enabled: boolean,
): Promise<({ ok: true } & CompetitionNoticeResult) | Failure> {
  if (!isCompetitionId(competitionId) || typeof enabled !== "boolean") {
    return { ok: false, reason: "failed" };
  }
  return run((accessToken) =>
    createSetCompetitionNoticeUseCase(accessToken).execute(
      competitionId,
      enabled,
    ),
  );
}
