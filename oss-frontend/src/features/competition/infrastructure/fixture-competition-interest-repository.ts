import type { CompetitionInterestRepository } from "@/features/competition/domain/competition-interest-repository";

/**
 * 관심 등록 API가 나오기 전까지 쓰는 고정 관심 목록 (#334).
 *
 * 관심 필터를 먼저 만들기 위해 둔다. 로그인한 사용자는 누구나 이 세 대회를 관심 등록한 것으로 본다 —
 * 접수 중 · 노기 · 다른 지역이 섞이게 골라 필터를 겹쳤을 때 결과가 줄어드는 게 보이게 했다.
 * 관심 등록 API(#335)가 나오면 External 저장소로 바꿔 끼우고 이 파일은 지운다.
 */
const FIXTURE_INTERESTED_IDS = [
  "seoul-open-championship",
  "busan-nogi-open",
  "jeju-open",
];

export class FixtureCompetitionInterestRepository
  implements CompetitionInterestRepository
{
  async getInterestedCompetitionIds(): Promise<string[]> {
    return [...FIXTURE_INTERESTED_IDS];
  }
}
