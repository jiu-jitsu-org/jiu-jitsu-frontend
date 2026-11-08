/**
 * 대회 상세 조회수 (#362). 조회수는 익명 숫자라 누구나 읽는다.
 */
export interface CompetitionViewRepository {
  /** 상세를 한 번 연 것으로 세고, 센 뒤의 조회수를 돌려준다. */
  recordView(competitionId: string): Promise<number>;
}
