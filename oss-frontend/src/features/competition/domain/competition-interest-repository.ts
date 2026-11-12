import type { CompetitionNoticeResult } from "@/features/competition/domain/competition-alert";

/** 관심 등록·해제 결과 */
export type CompetitionInterestResult = {
  interested: boolean;
  interestCount: number;
};

/**
 * 대회 관심 등록 (#335) · 이 대회 알림 (#376). 모두 로그인한 사용자 몫이고 여러 번 불러도 같은 결과다.
 * 관심 수·내 관심은 대회 목록·상세 항목에 함께 실려 온다.
 */
export interface CompetitionInterestRepository {
  setInterested(
    competitionId: number,
    interested: boolean,
  ): Promise<CompetitionInterestResult>;
  /** 이 대회 알림 켜기(관심이 없으면 관심도 등록)·끄기(관심은 그대로). */
  setNotice(competitionId: number, enabled: boolean): Promise<CompetitionNoticeResult>;
}
