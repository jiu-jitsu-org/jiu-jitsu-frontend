import type { Competition } from "@/features/competition/domain/competition";
import type { RegistrationStatus } from "@/features/competition/domain/competition-registration";

export type InterestBannerItem = {
  competition: Competition;
  registration: RegistrationStatus | null;
};

/**
 * 관심 대회 배너에 띄울 대회 — 내가 관심 등록한 대회 중 아직 열리지 않은(오늘 포함) 대회.
 *
 * 대회 날짜가 가까운 순, 같으면 이름순. 필터와 무관하다: 지역·접수 중 필터를 켜 둬도 내 대회는 위에 늘 보인다.
 * 지난 대회는 뺀다 — 끝난 대회가 맨 앞 자리를 차지하지 않게.
 */
export function upcomingInterested(
  items: readonly InterestBannerItem[],
  interestedIds: ReadonlySet<string>,
  today: string,
): InterestBannerItem[] {
  return items
    .filter(
      ({ competition }) =>
        interestedIds.has(competition.id) && competition.date >= today,
    )
    .sort(
      (a, b) =>
        a.competition.date.localeCompare(b.competition.date) ||
        a.competition.name.localeCompare(b.competition.name, "ko"),
    );
}
