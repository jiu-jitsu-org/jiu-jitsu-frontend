import type { InboxNotificationRepository } from "@/features/community/domain/inbox-notification-repository";

/** 알림 하나를 읽음 처리한다 (#187). 내 알림이 아니면 서버가 거절한다(PERMISSION_DENIED). */
export class MarkInboxNotificationReadUseCase {
  constructor(private readonly repository: InboxNotificationRepository) {}

  async execute(id: number): Promise<void> {
    return this.repository.markRead(id);
  }
}
