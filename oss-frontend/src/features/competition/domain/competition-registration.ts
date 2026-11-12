import type { Competition } from "@/features/competition/domain/competition";

/**
 * 대회 접수 일정과 상태 규칙 (#333).
 *
 * 날짜는 모두 한국 날짜 "YYYY-MM-DD"이고, 접수 시작일·마감일·얼리버드 마감일 모두 그날 하루를 포함한다.
 * 상태(접수 예정·접수 중·마감)는 서버가 정해 주고(backend#193), 남은 날은 응답의 today로 센다 —
 * 기기 시계를 쓰지 않아 자정 근처에도 앱·웹이 같은 값을 본다.
 */

export type CompetitionRegistration = {
  /** 접수 시작일. 모르면 없다. */
  opensOn?: string;
  /** 접수 마감일. 모르면 없다. */
  closesOn?: string;
  /** 얼리버드 마감일. 가격 단계가 없는 대회는 없다. */
  earlyBirdClosesOn?: string;
};

/** 얼리버드 마감을 강조하기 시작하는 남은 날. D-7부터 D-day까지 강조한다. */
export const EARLY_BIRD_EMPHASIS_DAYS = 7;

export type RegistrationStatus =
  | { kind: "upcoming"; opensOn: string }
  | { kind: "open"; deadline: "early-bird" | "final"; daysLeft: number }
  | { kind: "closed" };

/**
 * 목록 줄의 접수 상태.
 *
 * - 접수 예정 → 여는 날
 * - 접수 중 → 얼리버드 접수 중이고 얼리버드 마감이 D-7 안이면 얼리버드 마감까지, 아니면 접수 마감까지 남은 날
 * - 접수 마감·종료 → 마감
 *
 * 보여 줄 날짜를 모르면(여는 날을 모르는 접수 예정, 마감일을 모르는 접수 중) 상태를 지어내지 않고 null — 줄을 뺀다.
 */
export function registrationStatusOf(
  competition: Pick<Competition, "status" | "earlyBirdOpen" | "registration">,
  today: string,
): RegistrationStatus | null {
  const { opensOn, closesOn } = competition.registration ?? {};
  switch (competition.status) {
    case "upcoming":
      return opensOn && isDateKey(opensOn) ? { kind: "upcoming", opensOn } : null;
    case "closed":
    case "ended":
      return { kind: "closed" };
    case "open": {
      const earlyBird = openEarlyBirdDeadline(competition, today);
      if (earlyBird) {
        const daysLeft = daysBetween(today, earlyBird);
        if (daysLeft <= EARLY_BIRD_EMPHASIS_DAYS) {
          return { kind: "open", deadline: "early-bird", daysLeft };
        }
      }
      if (!closesOn || !isDateKey(closesOn) || closesOn < today) return null;
      return {
        kind: "open",
        deadline: "final",
        daysLeft: daysBetween(today, closesOn),
      };
    }
  }
}

/**
 * 아직 지나지 않은 얼리버드 마감일 — 서버가 얼리버드 접수 중(earlyBirdOpen)이라고 할 때만.
 * 날짜 모양이 틀렸거나 이미 지났으면 없는 것으로 본다.
 */
export function openEarlyBirdDeadline(
  competition: Pick<Competition, "earlyBirdOpen" | "registration">,
  today: string,
): string | undefined {
  const earlyBird = competition.registration?.earlyBirdClosesOn;
  if (!competition.earlyBirdOpen || !earlyBird || !isDateKey(earlyBird)) {
    return undefined;
  }
  return earlyBird >= today ? earlyBird : undefined;
}

/** "YYYY-MM-DD" 모양인지. 문자열 크기 비교가 날짜순과 같으려면 자릿수가 맞아야 한다. */
export function isDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** 두 한국 날짜 사이 일수(to - from). 날짜만 있는 값이라 UTC 자정으로 놓고 빼면 서머타임 걱정이 없다. */
export function daysBetween(from: string, to: string): number {
  return Math.round((dateOnlyToUtcMs(to) - dateOnlyToUtcMs(from)) / DAY_MS);
}

/** 날짜에 일수를 더한 한국 날짜. 음수면 뺀다. */
export function addDays(date: string, days: number): string {
  return new Date(dateOnlyToUtcMs(date) + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

function dateOnlyToUtcMs(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}
