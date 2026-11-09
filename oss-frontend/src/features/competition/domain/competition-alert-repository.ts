import type {
  CompetitionAlertNotification,
  CompetitionAlertSettings,
} from "@/features/competition/domain/competition-alert";

/**
 * 관심 대회 마감 알림 저장소 (#375~#377). 모두 로그인한 사용자 몫이다.
 *
 * 설정(전체 켜기·대회별 끄기)은 앱 설정과 같은 값을 읽고 쓴다. 알림함 목록은 앱이 보낸 알림이 쌓인 것이다.
 */
export interface CompetitionAlertRepository {
  getSettings(): Promise<CompetitionAlertSettings>;
  /** '관심 대회 알림' 전체 켜기·끄기 — 앱 설정 항목과 같은 값. */
  setEnabled(enabled: boolean): Promise<void>;
  /** 이 대회 알림만 끄기(true)·다시 받기(false). 관심은 건드리지 않는다. */
  setMuted(competitionId: string, muted: boolean): Promise<void>;
  /** 알림함의 대회 마감 알림 — 최신순. */
  getNotifications(): Promise<CompetitionAlertNotification[]>;
  /** 읽음 처리. ids가 없으면 전부. */
  markRead(ids?: readonly string[]): Promise<void>;
}
