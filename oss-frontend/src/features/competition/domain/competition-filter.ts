import type { Competition } from "@/features/competition/domain/competition";
import type { CompetitionRegion } from "@/features/competition/domain/competition-region";
import type { RegistrationStatus } from "@/features/competition/domain/competition-registration";

/**
 * 대회 목록 필터(#334) — 관심 · 지역 · 접수 중 · 노기.
 *
 * 넷은 모두 "그리고"로 겹친다. 지역은 여러 시·도를 고를 수 있고, 고른 시·도 중 하나면 통과한다.
 * 아무것도 고르지 않은 지역(빈 배열)은 "전체"다.
 */
export type CompetitionFilter = {
  /** 관심 등록한 대회만 */
  interestedOnly: boolean;
  regions: readonly CompetitionRegion[];
  /** 지금 신청할 수 있는 대회만 */
  openOnly: boolean;
  /** 노기 부문이 있는 대회만 */
  nogiOnly: boolean;
};

export const EMPTY_COMPETITION_FILTER: CompetitionFilter = {
  interestedOnly: false,
  regions: [],
  openOnly: false,
  nogiOnly: false,
};

export function isCompetitionFilterEmpty(filter: CompetitionFilter): boolean {
  return (
    !filter.interestedOnly &&
    filter.regions.length === 0 &&
    !filter.openOnly &&
    !filter.nogiOnly
  );
}

/**
 * 대회 하나가 필터를 통과하는지.
 *
 * 접수 상태는 "오늘" 기준이라 대회 자체가 아니라 호출부가 계산해 함께 넘긴다.
 * 지역이 아직 안 정해진 대회는 지역을 고르면 빠진다.
 */
export function matchesCompetitionFilter(
  target: { competition: Competition; registration: RegistrationStatus | null },
  filter: CompetitionFilter,
  interestedIds: ReadonlySet<string>,
): boolean {
  const { competition, registration } = target;

  if (filter.interestedOnly && !interestedIds.has(competition.id)) return false;
  if (
    filter.regions.length > 0 &&
    (!competition.region || !filter.regions.includes(competition.region))
  ) {
    return false;
  }
  if (filter.openOnly && registration?.kind !== "open") return false;
  if (filter.nogiOnly && !competition.divisions.includes("nogi")) return false;
  return true;
}
