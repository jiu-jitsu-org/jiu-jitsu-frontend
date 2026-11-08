import type { CompetitionViewRepository } from "@/features/competition/domain/competition-view-repository";

/**
 * 조회수 API가 나오기 전까지 쓰는 고정 조회수 (#362).
 *
 * 상세를 열 때마다 서버 메모리에서 1씩 올린다 — 같은 사람이 다시 열어도 센다(중복을 어떻게 셀지는 API와 정한다).
 * 서버를 다시 켜면 처음 값으로 돌아간다. 상태를 globalThis에 두는 까닭은 관심 저장소와 같다.
 */
const INITIAL_VIEW_COUNTS: Record<string, number> = {
  "seoul-open-championship": 214,
  "gyeonggi-governor-cup": 171,
  "seoul-nogi-invitational": 133,
  "busan-nogi-open": 96,
  "daejeon-open": 58,
  "jeju-open": 44,
  "gyeonggi-youth": 31,
  "gwangju-championship": 486,
  "incheon-autumn-open": 302,
};

const STORE_KEY = Symbol.for("oss.fixture.competition-views");

function viewCounts(): Map<string, number> {
  const scope = globalThis as typeof globalThis & {
    [STORE_KEY]?: Map<string, number>;
  };
  scope[STORE_KEY] ??= new Map(Object.entries(INITIAL_VIEW_COUNTS));
  return scope[STORE_KEY];
}

export class FixtureCompetitionViewRepository
  implements CompetitionViewRepository
{
  async recordView(competitionId: string): Promise<number> {
    const counts = viewCounts();
    const next = (counts.get(competitionId) ?? 0) + 1;
    counts.set(competitionId, next);
    return next;
  }
}
