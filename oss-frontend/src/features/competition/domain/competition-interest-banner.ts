import type { Competition } from "@/features/competition/domain/competition";
import {
  daysBetween,
  isDateKey,
  openEarlyBirdDeadline,
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
  interestedIds: ReadonlySet<number>,
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

/** 곧 열려요 후보 — 대회 날짜(`eventDate`, "YYYY-MM-DD")가 오늘부터 DEADLINE_SOON_DAYS일 안인 관심 대회. */
export type EventSoonItem = InterestBannerItem & { eventDate: string };

/**
 * 곧 열리는 관심 대회 — 내가 관심 등록한 대회 중 대회 날이 오늘부터 7일 안(D-7 ~ 당일)이고 끝나지 않은 대회.
 *
 * 접수 상태와 무관하다 — 접수가 끝난(마감) 대회는 곧 마감 배너에서 빠지니, 신청을 마친 사람에게는 대회가 다가온다는 것이
 * 지금 챙길 일이다. 같은 대회의 곧 마감 항목이 있으면(deadlineIds) 그쪽이 먼저라 여기서는 뺀다 — 배너는 한 가지만 말한다.
 * 대회 날이 가까운 순, 같으면 이름순. 필터와 무관하다.
 */
export function eventSoonInterested(
  items: readonly InterestBannerItem[],
  interestedIds: ReadonlySet<number>,
  today: string,
  deadlineIds: ReadonlySet<number>,
): EventSoonItem[] {
  return items
    .flatMap((item) => {
      const { competition } = item;
      if (!interestedIds.has(competition.id)) return [];
      if (deadlineIds.has(competition.id)) return [];
      if (competition.status === "ended" || !isDateKey(competition.date)) {
        return [];
      }
      const days = daysBetween(today, competition.date);
      if (days < 0 || days > DEADLINE_SOON_DAYS) return [];
      return [{ ...item, eventDate: competition.date }];
    })
    .sort(
      (a, b) =>
        a.eventDate.localeCompare(b.eventDate) ||
        a.competition.name.localeCompare(b.competition.name, "ko"),
    );
}

/**
 * 오늘(포함) 이후 처음 오는 접수 마감일. 얼리버드 마감이 아직 남았으면 그날, 아니면 접수 마감일.
 * 이미 접수가 끝났거나 날짜 값이 잘못됐으면 null.
 */
function nextRegistrationDeadline(
  competition: Competition,
  today: string,
): string | null {
  const earlyBird = openEarlyBirdDeadline(competition, today);
  if (earlyBird) return earlyBird;
  const closesOn = competition.registration?.closesOn;
  if (!closesOn || !isDateKey(closesOn) || today > closesOn) return null;
  return closesOn;
}
