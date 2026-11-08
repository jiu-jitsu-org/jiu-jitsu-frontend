/**
 * 대회 접수 일정과 상태 규칙 (#333).
 *
 * 날짜는 모두 한국 날짜 "YYYY-MM-DD"이고, 접수 시작일·마감일·얼리버드 마감일 모두 그날 하루를 포함한다.
 * "오늘"은 호출부가 서버 시각으로 정해 넘긴다 — 기기 시계를 쓰지 않아 자정 근처에도 앱·웹이 같은 값을 본다.
 */

export type CompetitionRegistration = {
  /** 접수 시작일 */
  opensOn: string;
  /** 접수 마감일 */
  closesOn: string;
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
 * 오늘 기준 접수 상태.
 *
 * - 시작일 전 → 접수 예정(오픈일)
 * - 시작일 ~ 마감일 → 접수 중. 얼리버드 마감이 D-7 안이면 얼리버드 마감까지, 아니면 접수 마감까지 남은 날
 * - 마감일 뒤 → 마감
 */
export function registrationStatusOn(
  registration: CompetitionRegistration,
  today: string,
): RegistrationStatus | null {
  // 날짜 모양이 틀렸거나 시작일이 마감일보다 늦으면 상태를 지어내지 않는다 — "마감 D-NaN"이나
  // 마감일을 무시한 "접수 예정"을 보여 주느니 줄을 빼는 편이 낫다.
  if (
    !isDateKey(registration.opensOn) ||
    !isDateKey(registration.closesOn) ||
    registration.opensOn > registration.closesOn
  ) {
    return null;
  }

  if (today < registration.opensOn) {
    return { kind: "upcoming", opensOn: registration.opensOn };
  }
  if (today > registration.closesOn) {
    return { kind: "closed" };
  }

  // 얼리버드 마감이 접수 마감보다 늦게 잡힌 값은 무시한다 — 실제로는 없는 날을 빨강으로 약속하게 된다.
  const earlyBirdClosesOn =
    registration.earlyBirdClosesOn &&
    isDateKey(registration.earlyBirdClosesOn) &&
    registration.earlyBirdClosesOn <= registration.closesOn
      ? registration.earlyBirdClosesOn
      : undefined;
  if (earlyBirdClosesOn && today <= earlyBirdClosesOn) {
    const earlyBirdDaysLeft = daysBetween(today, earlyBirdClosesOn);
    if (earlyBirdDaysLeft <= EARLY_BIRD_EMPHASIS_DAYS) {
      return {
        kind: "open",
        deadline: "early-bird",
        daysLeft: earlyBirdDaysLeft,
      };
    }
  }
  return {
    kind: "open",
    deadline: "final",
    daysLeft: daysBetween(today, registration.closesOn),
  };
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

function dateOnlyToUtcMs(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}
