import type { Competition } from "@/features/competition/domain/competition";
import {
  EARLY_BIRD_EMPHASIS_DAYS,
  type RegistrationStatus,
} from "@/features/competition/domain/competition-registration";

/**
 * 관심 대회 마감 배너 (#344) — 관심 등록한 대회 중 접수 마감이 얼마 안 남은 대회.
 *
 * '곧 마감'은 얼리버드 강조와 같은 D-7부터다 — 줄의 빨강 강조와 배너가 같은 날부터 함께 보이게.
 * 접수 상태가 이미 얼리버드(D-7 안)와 접수 마감 중 먼저 오는 마감을 골라 두므로 그 남은 날만 본다.
 */
export const CLOSING_SOON_DAYS = EARLY_BIRD_EMPHASIS_DAYS;

export type ClosingSoonTarget = {
  competition: Competition;
  registration: RegistrationStatus | null;
};

export type ClosingSoonItem = {
  competition: Competition;
  registration: Extract<RegistrationStatus, { kind: "open" }>;
};

/**
 * 관심 대회 중 곧 마감인 대회 — 마감이 가까운 순, 같으면 대회 날짜순·이름순.
 *
 * 필터와 무관하다: 지역·노기 필터를 켜 둬도 내 대회의 마감은 놓치지 않게 한다.
 */
export function closingSoonInterested(
  targets: readonly ClosingSoonTarget[],
  interestedIds: ReadonlySet<string>,
): ClosingSoonItem[] {
  const items: ClosingSoonItem[] = [];
  for (const { competition, registration } of targets) {
    if (!interestedIds.has(competition.id)) continue;
    if (registration?.kind !== "open") continue;
    if (registration.daysLeft > CLOSING_SOON_DAYS) continue;
    items.push({ competition, registration });
  }
  return items.sort(
    (a, b) =>
      a.registration.daysLeft - b.registration.daysLeft ||
      a.competition.date.localeCompare(b.competition.date) ||
      a.competition.name.localeCompare(b.competition.name, "ko"),
  );
}
