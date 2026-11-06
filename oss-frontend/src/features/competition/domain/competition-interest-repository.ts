/**
 * 대회 관심 등록 (#334 필터 · #335 등록).
 *
 * 관심 수는 익명이라 누구나 읽는다. 내가 등록한 대회와 등록·해제는 로그인한 사용자만 한다.
 */
export interface CompetitionInterestRepository {
  /** 내가 관심 등록한 대회 id. */
  getInterestedCompetitionIds(): Promise<string[]>;
  /** 대회별 관심 수. 아무도 등록하지 않은 대회는 빠져 있을 수 있다(= 0). */
  getInterestCounts(): Promise<Record<string, number>>;
  /** 관심 등록(true)·해제(false). 바뀐 뒤의 관심 수를 돌려준다. 이미 그 상태면 그대로 둔다. */
  setInterested(competitionId: string, interested: boolean): Promise<number>;
}
