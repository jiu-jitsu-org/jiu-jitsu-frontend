"use server";

import {
  createMarkCompetitionAlertNotificationsReadUseCase,
  createSetCompetitionAlertMutedUseCase,
  createSetCompetitionAlertsEnabledUseCase,
} from "@/features/competition/application/competition-use-case-factory";
import { isCompetitionPageEnabled } from "@/features/competition/application/is-competition-page-enabled";
import { readSessionToken } from "@/shared/lib/auth";

export type CompetitionAlertActionResult =
  { ok: true } | { ok: false; reason: "unauthenticated" | "failed" };

/** 실제 대회 id보다 넉넉한 상한 — 화면 밖에서 아무 값이나 보내도 저장소까지 가지 않게. */
const MAX_ID_LENGTH = 100;
/** 알림함 한 화면의 대회 알림보다 넉넉한 상한. */
const MAX_IDS = 200;

function isId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_ID_LENGTH
  );
}

/**
 * 관심 대회 마감 알림 Server Action (#375~#377).
 *
 * 화면은 누르는 순간 먼저 바꿔 보여 주고(낙관적), 실패면 되돌린다. 실제 로그인 경계는 여기서 다시 보는 세션이다.
 */
async function run(
  task: () => Promise<void>,
): Promise<CompetitionAlertActionResult> {
  // 대회 화면이 닫혀 있는 곳(운영)에서는 가짜 저장소에 아무것도 쌓지 않는다.
  if (!isCompetitionPageEnabled()) return { ok: false, reason: "failed" };
  if ((await readSessionToken()) === null) {
    return { ok: false, reason: "unauthenticated" };
  }
  try {
    await task();
    return { ok: true };
  } catch {
    return { ok: false, reason: "failed" };
  }
}

/** '관심 대회 알림' 전체 켜기·끄기 — 첫 관심 등록 시트의 '알림 받기'(#375). */
export async function setCompetitionAlertsEnabledAction(
  enabled: boolean,
): Promise<CompetitionAlertActionResult> {
  if (typeof enabled !== "boolean") return { ok: false, reason: "failed" };
  return run(() => createSetCompetitionAlertsEnabledUseCase().execute(enabled));
}

/** 이 대회 알림만 끄기·다시 받기 — 대회 상세 종(#376)·알림함 줄(#377). */
export async function setCompetitionAlertMutedAction(
  competitionId: string,
  muted: boolean,
): Promise<CompetitionAlertActionResult> {
  if (!isId(competitionId) || typeof muted !== "boolean") {
    return { ok: false, reason: "failed" };
  }
  return run(() =>
    createSetCompetitionAlertMutedUseCase().execute(competitionId, muted),
  );
}

/** 대회 마감 알림 읽음 처리(#377). ids가 없으면 전부 — 알림함 '모두 읽음'. */
export async function markCompetitionAlertsReadAction(
  ids?: string[],
): Promise<CompetitionAlertActionResult> {
  if (
    ids !== undefined &&
    (!Array.isArray(ids) || ids.length > MAX_IDS || !ids.every(isId))
  ) {
    return { ok: false, reason: "failed" };
  }
  return run(() =>
    createMarkCompetitionAlertNotificationsReadUseCase().execute(ids),
  );
}
