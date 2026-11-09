import { createGetCompetitionAlertNotificationsUseCase } from "@/features/competition/application/competition-use-case-factory";
import { isCompetitionPageEnabled } from "@/features/competition/application/is-competition-page-enabled";
import { loadCompetitionAlertSettings } from "@/features/competition/application/load-competition-alert-settings";
import type {
  CompetitionAlertNotification,
  CompetitionAlertSettings,
} from "@/features/competition/domain/competition-alert";

export type CompetitionAlertInbox = {
  notifications: CompetitionAlertNotification[];
  /** 못 읽으면 null — '이 대회 알림 받지 않기'만 빠진다. */
  settings: CompetitionAlertSettings | null;
};

/**
 * 알림함에 섞을 대회 마감 알림(#377). 로그인한 사용자만 부른다.
 * 못 읽어도 알림함을 막지 않는다 — 커뮤니티 알림만 보인다.
 * 대회 화면이 닫혀 있는 곳(운영)에서는 비운다 — 예시 알림이 보이면 안 되고, 눌러도 열 대회 상세가 없다.
 */
export async function loadCompetitionAlertInbox(): Promise<CompetitionAlertInbox> {
  if (!isCompetitionPageEnabled()) return { notifications: [], settings: null };
  const [notifications, settings] = await Promise.all([
    createGetCompetitionAlertNotificationsUseCase()
      .execute()
      .catch(() => [] as CompetitionAlertNotification[]),
    loadCompetitionAlertSettings(),
  ]);
  return { notifications, settings };
}
