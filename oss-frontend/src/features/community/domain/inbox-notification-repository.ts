import type { InboxNotification } from "@/features/community/domain/inbox-notification";

/**
 * 알림함 저장소 계약 (#187) — 업스트림 notice-controller의 알림 목록 · 읽음 처리.
 *
 * 모두 로그인 전용이라 구현체는 authed HttpClient로만 조립한다.
 */
export interface InboxNotificationRepository {
  /** 알림 목록(GET /notice). 최신순. 페이지네이션 없이 전체가 온다. */
  getList(): Promise<InboxNotification[]>;
  /** 개별 읽음 처리(PUT /notice/{id}). */
  markRead(id: number): Promise<void>;
  /** 모두 읽음 처리(PUT /notice). */
  markAllRead(): Promise<void>;
}
