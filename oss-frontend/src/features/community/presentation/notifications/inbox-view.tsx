"use client";

import { useState } from "react";

import {
  INBOX_RETENTION_DAYS,
  type InboxNotification,
} from "@/features/community/domain/inbox-notification";
import { useOpenBalanceDetail } from "@/features/community/presentation/balance/use-open-balance-detail";
import { InboxAppBar } from "@/features/community/presentation/notifications/inbox-app-bar";
import { InboxEmptyState } from "@/features/community/presentation/notifications/inbox-empty-state";
import { InboxItem } from "@/features/community/presentation/notifications/inbox-item";
import { useOpenPostDetail } from "@/features/community/presentation/use-open-post-detail";
import { usePendingToast } from "@/shared/ui";

/**
 * 알림함 화면 본체 (클라이언트) — 목록 · 읽음 처리 · 상세 이동.
 *
 * 셀 탭: 읽음으로 바꾸고(낙관적) 대상 상세를 연다. 앱에서는 OPEN_SUBVIEW로 상세가 위에 쌓이고
 *   이 화면은 그대로 살아 있어, 돌아왔을 때 읽음 상태가 유지된다.
 * 모두 읽음: 전체를 읽음으로 바꾼다.
 *
 * 알림함을 연 뒤에 대상이 삭제돼 상세까지 들어간 경우는 상세(PostDetailGone)가 문구를 남기고 닫히고,
 * 돌아온 이 화면이 usePendingToast로 받아 띄운다 — 피드와 같은 공용 경로라 문구도 피드 문구다.
 *
 * TODO(#187 API 연동): 읽음 처리를 PUT /notice/{id} · PUT /notice 로 저장하고 실패 시 되돌린다.
 * TODO(#187, backend#154): 삭제된 대상이면 이동하지 않고 알림함 문구(inbox-copy)로 토스트를 띄운다.
 */
export function InboxView({
  initialNotifications,
}: {
  initialNotifications: InboxNotification[];
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const openPostDetail = useOpenPostDetail();
  const openBalanceDetail = useOpenBalanceDetail();
  usePendingToast();

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  function markRead(id: number) {
    setNotifications((items) =>
      items.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
    );
  }

  function markAllRead() {
    setNotifications((items) =>
      items.map((item) => (item.isRead ? item : { ...item, isRead: true })),
    );
  }

  function handlePress(notification: InboxNotification) {
    if (!notification.isRead) markRead(notification.id);

    const { target } = notification;
    if (!target) return;
    if (target.kind === "post") openPostDetail(target.postId);
    else openBalanceDetail(target.contentId);
  }

  return (
    <>
      <InboxAppBar
        canMarkAllRead={unreadCount > 0}
        onMarkAllRead={markAllRead}
      />

      {notifications.length === 0 ? (
        <InboxEmptyState />
      ) : (
        <>
          <p className="px-4 pt-2 pb-3 text-label-m text-text-secondary">
            새 알림 <span className="ml-1 text-primary">{unreadCount}</span>
          </p>

          <ul className="border-t border-border-subtle">
            {notifications.map((notification) => (
              <InboxItem
                key={notification.id}
                notification={notification}
                onPress={handlePress}
              />
            ))}
          </ul>

          <p className="px-4 pt-8 pb-[calc(32px+env(safe-area-inset-bottom))] text-center text-label-m text-text-secondary">
            최근 {INBOX_RETENTION_DAYS}일 이내 알림만 보여요
          </p>
        </>
      )}
    </>
  );
}
