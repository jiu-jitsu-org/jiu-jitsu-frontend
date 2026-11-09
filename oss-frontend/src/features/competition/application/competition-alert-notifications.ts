import type { CompetitionAlertNotification } from "@/features/competition/domain/competition-alert";
import type { CompetitionAlertRepository } from "@/features/competition/domain/competition-alert-repository";

/** 알림함의 대회 마감 알림 (#377) — 최신순. */
export class GetCompetitionAlertNotificationsUseCase {
  constructor(private readonly alertRepository: CompetitionAlertRepository) {}

  execute(): Promise<CompetitionAlertNotification[]> {
    return this.alertRepository.getNotifications();
  }
}

/** 대회 마감 알림 읽음 처리 (#377). ids가 없으면 전부 — 알림함 '모두 읽음'. */
export class MarkCompetitionAlertNotificationsReadUseCase {
  constructor(private readonly alertRepository: CompetitionAlertRepository) {}

  execute(ids?: readonly string[]): Promise<void> {
    return this.alertRepository.markRead(ids);
  }
}
