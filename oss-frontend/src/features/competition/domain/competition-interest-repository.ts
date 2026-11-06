/** 내가 관심 등록한 대회. 로그인한 사용자만 갖는다. 등록·해제는 #335에서 붙인다. */
export interface CompetitionInterestRepository {
  getInterestedCompetitionIds(): Promise<string[]>;
}
