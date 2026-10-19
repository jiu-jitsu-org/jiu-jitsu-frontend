import type { InboxNotification } from "@/features/community/domain/inbox-notification";
import type { InboxNotificationRepository } from "@/features/community/domain/inbox-notification-repository";

/**
 * 알림함 목록을 조회한다 (#187).
 *
 * 로그인 전용이라 factory가 authed repository로만 조립한다.
 * 30일 필터 · 차단/숨김/신고 대상 제외는 서버 몫이다(backend#154).
 */
export class GetInboxNotificationsUseCase {
  constructor(private readonly repository: InboxNotificationRepository) {}

  async execute(): Promise<InboxNotification[]> {
    return this.repository.getList();
  }
}
