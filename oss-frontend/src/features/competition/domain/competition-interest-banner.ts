import type { Competition } from "@/features/competition/domain/competition";
import {
  daysBetween,
  isDateKey,
  type RegistrationStatus,
} from "@/features/competition/domain/competition-registration";

export type InterestBannerItem = {
  competition: Competition;
  registration: RegistrationStatus | null;
};

/**
 * 곧 마감 배너에 올리는 남은 날 — 다음 접수 마감이 오늘부터 7일 안(D-7 ~ 오늘 마감)인 관심 대회만 띄운다(#396).
 * 목록 줄의 얼리버드 강조(EARLY_BIRD_EMPHASIS_DAYS)와 같은 한 주라, 배너에 뜬 대회는 칩에도 D-n이 함께 보인다.
 * 더 넓히면 관심 필터와 같은 목록이 되어 배너가 '지금 챙길 것'을 알리지 못한다.
 */
export const DEADLINE_SOON_DAYS = 7;

/**
 * 관심 대회 배너에 띄울 대회 — 내가 관심 등록한 대회 중 다음 접수 마감이 곧 오는 대회(#396).
 *
 * 다음 마감 = 아직 지나지 않은 얼리버드 마감, 없으면 접수 마감. 접수 중인 대회만 본다 — 열리지도 않은 접수를
 * '곧 마감'이라 부르지 않는다. 마감이 가까운 순, 같으면 이름순.
 * 필터와 무관하다: 지역·접수 중 필터를 켜 둬도 곧 마감인 내 대회는 위에 뜬다.
 */
/** 곧 마감 후보 — 어느 마감(얼리버드·접수)이 다가와 뽑혔는지(`deadline`, "YYYY-MM-DD")를 함께 든다. */
export type DeadlineSoonItem = InterestBannerItem & { deadline: string };

export function deadlineSoonInterested(
  items: readonly InterestBannerItem[],
  interestedIds: ReadonlySet<string>,
  today: string,
): DeadlineSoonItem[] {
  return items
    .flatMap((item) => {
      if (!interestedIds.has(item.competition.id)) return [];
      if (item.registration?.kind !== "open") return [];
      const deadline = nextRegistrationDeadline(item.competition, today);
      if (!deadline || daysBetween(today, deadline) > DEADLINE_SOON_DAYS) {
        return [];
      }
      return [{ item, deadline }];
    })
    .sort(
      (a, b) =>
        a.deadline.localeCompare(b.deadline) ||
        a.item.competition.name.localeCompare(b.item.competition.name, "ko"),
    )
    .map(({ item, deadline }) => ({ ...item, deadline }));
}

/**
 * 오늘(포함) 이후 처음 오는 접수 마감일. 얼리버드 마감이 아직 남았으면 그날, 아니면 접수 마감일.
 * 이미 접수가 끝났거나 날짜 값이 잘못됐으면 null.
 */
function nextRegistrationDeadline(
  competition: Competition,
  today: string,
): string | null {
  const registration = competition.registration;
  if (!registration || !isDateKey(registration.closesOn)) return null;
  if (today > registration.closesOn) return null;
  const earlyBird = registration.earlyBirdClosesOn;
  // 접수 마감보다 늦게 잡힌 얼리버드 값은 접수 상태 규칙처럼 무시한다.
  if (
    earlyBird &&
    isDateKey(earlyBird) &&
    earlyBird <= registration.closesOn &&
    today <= earlyBird
  ) {
    return earlyBird;
  }
  return registration.closesOn;
}
