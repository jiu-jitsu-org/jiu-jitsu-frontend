import type { Competition } from "@/features/competition/domain/competition";
import {
  EARLY_BIRD_EMPHASIS_DAYS,
  daysBetween,
  isDateKey,
  openEarlyBirdDeadline,
  registrationStatusOf,
} from "@/features/competition/domain/competition-registration";

/**
 * 대회 상세의 상태와 일정 규칙 (#361 · #363 · #368).
 *
 * 목록(#333)은 접수 상태만 보지만 상세는 대회 당일·종료까지 본다. 날짜는 모두 한국 날짜 "YYYY-MM-DD",
 * "오늘"은 호출부가 서버 시각으로 정해 넘긴다.
 */

/** 끝난 대회에 결과 남기기 배너를 띄우는 기간 — 대회 다음 날부터 이 날수까지(#368). */
export const RESULT_PROMPT_DAYS = 14;

/**
 * 상세 맨 위 상태 — 목록과 같은 접수 상태 셋(접수 예정 · 접수 중 · 마감)에 대회 당일 · 종료를 더한다.
 *
 * 접수 중이면 "가장 가까운 마감"을 고른다: 얼리버드 마감이 아직 안 지났으면 그것, 아니면 접수 마감.
 * 목록 줄은 얼리버드를 D-7부터만 보여 주지만 상세는 일정을 다 보는 화면이라 가장 가까운 마감을 늘 보여 주고,
 * 빨강 강조만 목록과 같은 D-7부터 건다.
 */
export type CompetitionDetailStatus =
  | { kind: "unannounced"; daysToCompetition: number }
  | { kind: "upcoming"; opensOn: string }
  | {
      kind: "open";
      deadline: "early-bird" | "final";
      daysLeft: number;
      urgent: boolean;
    }
  | { kind: "closed"; daysToCompetition: number }
  | { kind: "today" }
  | { kind: "ended"; daysAgo: number };

export function detailStatusOn(
  competition: Competition,
  today: string,
): CompetitionDetailStatus | null {
  // 대회 날짜 모양이 틀렸으면 상태를 지어내지 않는다 — "종료"·"D-NaN"을 보여 주느니 상태 줄을 뺀다.
  if (!isDateKey(competition.date)) return null;
  if (competition.status === "ended" || today > competition.date) {
    return {
      kind: "ended",
      daysAgo: Math.max(0, daysBetween(competition.date, today)),
    };
  }
  if (today === competition.date) return { kind: "today" };

  const daysToCompetition = daysBetween(today, competition.date);
  // 접수 중이면 가장 가까운 마감 — 얼리버드 마감이 남았으면 그것(접수 마감을 몰라도 보여 준다).
  const earlyBird =
    competition.status === "open"
      ? openEarlyBirdDeadline(competition, today)
      : undefined;
  if (earlyBird) {
    const daysLeft = daysBetween(today, earlyBird);
    return {
      kind: "open",
      deadline: "early-bird",
      daysLeft,
      urgent: daysLeft <= EARLY_BIRD_EMPHASIS_DAYS,
    };
  }
  const status = registrationStatusOf(competition, today);
  if (!status) return { kind: "unannounced", daysToCompetition };
  switch (status.kind) {
    case "upcoming":
      return status;
    case "closed":
      return { kind: "closed", daysToCompetition };
    case "open":
      return { ...status, urgent: false };
  }
}

export type CompetitionScheduleKey =
  | "opens"
  | "early-bird"
  | "closes"
  | "competition";

/** 일정 한 줄 — 지났으면 done, 오늘이면 today, 남았으면 daysLeft(1 이상). */
export type CompetitionScheduleItem = {
  key: CompetitionScheduleKey;
  label: string;
  date: string;
  state: "done" | "today" | "upcoming";
  daysLeft: number;
};

/**
 * 전체 일정(#363) — 접수 시작 · 얼리버드 마감 · 접수 마감 · 대회일 순.
 *
 * 없는 일정은 줄을 넣지 않는다.
 */
export function scheduleOf(
  competition: Competition,
  today: string,
): CompetitionScheduleItem[] {
  const entries: { key: CompetitionScheduleKey; label: string; date: string }[] =
    [];
  // 서버가 일정 순서(접수 시작 ≤ 얼리버드 마감 ≤ 접수 마감 ≤ 대회일)를 지켜 저장하므로, 아는 날만 줄로 둔다.
  const { opensOn, earlyBirdClosesOn, closesOn } =
    competition.registration ?? {};
  if (opensOn && isDateKey(opensOn)) {
    entries.push({ key: "opens", label: "접수 시작", date: opensOn });
  }
  if (earlyBirdClosesOn && isDateKey(earlyBirdClosesOn)) {
    entries.push({
      key: "early-bird",
      label: "얼리버드 마감",
      date: earlyBirdClosesOn,
    });
  }
  if (closesOn && isDateKey(closesOn)) {
    entries.push({ key: "closes", label: "접수 마감", date: closesOn });
  }
  if (isDateKey(competition.date)) {
    entries.push({ key: "competition", label: "대회", date: competition.date });
  }

  return entries.map((entry) => {
    const daysLeft = daysBetween(today, entry.date);
    return {
      ...entry,
      state: daysLeft < 0 ? "done" : daysLeft === 0 ? "today" : "upcoming",
      daysLeft: Math.max(0, daysLeft),
    };
  });
}

/** 결과 남기기 배너를 띄울지(#368) — 대회 다음 날부터 RESULT_PROMPT_DAYS일까지. */
export function shouldPromptResult(
  status: CompetitionDetailStatus | null,
): boolean {
  return status?.kind === "ended" && status.daysAgo <= RESULT_PROMPT_DAYS;
}
