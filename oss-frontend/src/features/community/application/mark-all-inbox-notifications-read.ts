import type { InboxNotificationRepository } from "@/features/community/domain/inbox-notification-repository";

/** 내 알림을 모두 읽음 처리한다 (#187). */
export class MarkAllInboxNotificationsReadUseCase {
  constructor(private readonly repository: InboxNotificationRepository) {}

  async execute(): Promise<void> {
    return this.repository.markAllRead();
  }
}
