import type { CompetitionInterestRepository } from "@/features/competition/domain/competition-interest-repository";

/**
 * 관심 등록 API가 나오기 전까지 쓰는 고정 관심 데이터 (#334 · #335).
 *
 * 로그인한 사용자는 누구나 같은 "나"로 본다 — 사용자 구분은 API가 나오면 세션 토큰으로 한다.
 * 등록·해제는 서버 메모리에 남아 새로고침해도 유지되고, 서버를 다시 켜면 처음 상태로 돌아간다.
 * Server Action과 페이지가 서로 다른 번들에서 이 모듈을 따로 읽을 수 있어 상태는 globalThis에 둔다.
 * API가 나오면 External 저장소로 바꿔 끼우고 이 파일은 지운다.
 */

/** 나를 뺀 다른 사람들의 관심 수 — 많음·보통·적음·없음이 섞이게 잡았다. */
const OTHERS_INTEREST_COUNTS: Record<string, number> = {
  "seoul-open-championship": 128,
  "gyeonggi-governor-cup": 87,
  "seoul-nogi-invitational": 64,
  "busan-nogi-open": 41,
  "daejeon-open": 23,
  "jeju-open": 17,
  "gyeonggi-youth": 12,
  "weeknight-nogi-league": 9,
  "daegu-open": 6,
  "new-year-open-2027": 3,
  "gwangju-championship": 2,
};

/** 처음 "내"가 관심 등록해 둔 대회 — 접수 중 · 노기 · 다른 지역이 섞이게 골랐다. */
const INITIAL_INTERESTED_IDS = [
  "seoul-open-championship",
  "busan-nogi-open",
  "jeju-open",
];

const STORE_KEY = Symbol.for("oss.fixture.competition-interest");

function myInterests(): Set<string> {
  const scope = globalThis as typeof globalThis & {
    [STORE_KEY]?: Set<string>;
  };
  scope[STORE_KEY] ??= new Set(INITIAL_INTERESTED_IDS);
  return scope[STORE_KEY];
}

function countOf(competitionId: string, mine: Set<string>) {
  return (
    (OTHERS_INTEREST_COUNTS[competitionId] ?? 0) +
    (mine.has(competitionId) ? 1 : 0)
  );
}

export class FixtureCompetitionInterestRepository
  implements CompetitionInterestRepository
{
  async getInterestedCompetitionIds(): Promise<string[]> {
    return [...myInterests()];
  }

  async getInterestCounts(): Promise<Record<string, number>> {
    const mine = myInterests();
    const ids = new Set([...Object.keys(OTHERS_INTEREST_COUNTS), ...mine]);
    return Object.fromEntries([...ids].map((id) => [id, countOf(id, mine)]));
  }

  async setInterested(
    competitionId: string,
    interested: boolean,
  ): Promise<number> {
    const mine = myInterests();
    if (interested) mine.add(competitionId);
    else mine.delete(competitionId);
    return countOf(competitionId, mine);
  }
}
