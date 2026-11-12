import type { CompetitionAlertSettings } from "@/features/competition/domain/competition-alert";

/**
 * 관심 대회 마감 알림 설정 (#375 · #422). 로그인한 사용자 몫이다 — 앱 설정과 같은 서버 값을 읽고 쓴다.
 */
export interface CompetitionAlertRepository {
  getSettings(): Promise<CompetitionAlertSettings>;
  /**
   * 첫 관심 등록 시트의 답 — '알림 받기'(true)·'나중에'(false). 어느 쪽이든 물어본 것으로 남는다.
   * false는 이미 켜 둔 설정을 끄지 않는다.
   */
  answerPrompt(enabled: boolean): Promise<void>;
}
