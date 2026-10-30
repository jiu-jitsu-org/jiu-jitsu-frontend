"use client";

import { useRef, useState } from "react";

import {
  INBOX_RETENTION_DAYS,
  type InboxNotification,
} from "@/features/community/domain/inbox-notification";
import { useOpenBalanceDetail } from "@/features/community/presentation/balance/use-open-balance-detail";
import { InboxAppBar } from "@/features/community/presentation/notifications/inbox-app-bar";
import { InboxEmptyState } from "@/features/community/presentation/notifications/inbox-empty-state";
import { inboxGoneMessage } from "@/features/community/presentation/notifications/inbox-copy";
import { InboxItem } from "@/features/community/presentation/notifications/inbox-item";
import { useResolveInboxGone } from "@/features/community/presentation/notifications/use-resolve-inbox-gone";
import { useOpenPostDetail } from "@/features/community/presentation/use-open-post-detail";
import { bffFetch } from "@/shared/lib/http/bff-fetch";
import { usePendingToast, useToast } from "@/shared/ui";

/**
 * 알림함 화면 본체 (클라이언트) — 목록 · 읽음 처리 · 상세 이동.
 *
 * 셀 탭: 읽음으로 바꾸고(낙관적) 대상 상세를 연다. 저장(PUT /api/community/notifications/{id})은
 *   이동과 병렬로 보내고, 실패하면 조용히 안 읽음으로 되돌린다 — 사용자는 이미 상세로 넘어가
 *   토스트가 엉뚱한 화면에 뜬다. 앱에서는 OPEN_SUBVIEW로 상세가 위에 쌓이고 이 화면은 그대로 살아 있어,
 *   돌아왔을 때 읽음 상태가 유지된다.
 * 삭제된 대상: 이동하지 않고 이 화면에 머물러 알림함 문구(inbox-copy)로 토스트를 띄운다. 읽음 처리는 같다.
 *   목록에서 빼지 않는다 — 알림 자체는 사실이고, 30일이 지나면 서버가 내린다.
 *   삭제 판단은 useResolveInboxGone이 맡는다(서버 값 우선, 없으면 게시글 조회로 임시 판단).
 *   판단하는 동안(보통 0.5초 안) 셀은 이미 읽음으로 바뀌어 있어 탭이 먹었다는 것은 바로 보인다.
 * 모두 읽음: 전체를 읽음으로 바꾸고(낙관적) PUT /api/community/notifications로 저장한다.
 *   실패하면 그때 안 읽음이던 것만 되돌리고 토스트로 알린다(이 화면에 머물러 있으니 알려야 한다).
 *
 * 판단을 못 한 채 상세까지 들어간 경우(확인 시간 초과 · 판단 직후 삭제 · 밸런스 게임)는 상세(PostDetailGone)가
 * 문구를 남기고 닫히고, 돌아온 이 화면이 usePendingToast로 받아 띄운다 — 피드와 같은 공용 경로다.
 */
export function InboxView({
  initialNotifications,
}: {
  initialNotifications: InboxNotification[];
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [markAllPending, setMarkAllPending] = useState(false);
  const openPostDetail = useOpenPostDetail();
  const openBalanceDetail = useOpenBalanceDetail();
  const resolveGone = useResolveInboxGone();
  // 판단 중에 다른 셀(또는 같은 셀)을 또 탭하면 상세가 두 번 열린다 — 판단이 끝날 때까지 이동 탭을 막는다.
  const resolving = useRef(false);
  const toast = useToast();
  usePendingToast();

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  function setReadState(ids: ReadonlySet<number>, isRead: boolean) {
    setNotifications((items) =>
      items.map((item) => (ids.has(item.id) ? { ...item, isRead } : item)),
    );
  }

  async function markRead(id: number) {
    const ids = new Set([id]);
    setReadState(ids, true);

    const response = await bffFetch(`/api/community/notifications/${id}`, {
      method: "PUT",
    }).catch(() => null);
    if (!response?.ok) setReadState(ids, false);
  }

  async function markAllRead() {
    if (markAllPending) return;

    const ids = new Set(
      notifications.filter((item) => !item.isRead).map((item) => item.id),
    );
    setReadState(ids, true);
    setMarkAllPending(true);

    const response = await bffFetch("/api/community/notifications", {
      method: "PUT",
    }).catch(() => null);
    setMarkAllPending(false);

    if (!response?.ok) {
      setReadState(ids, false);
      toast.show("알림을 읽음 처리하지 못했어요");
    }
  }

  async function handlePress(notification: InboxNotification) {
    if (resolving.current) return;
    if (!notification.isRead) void markRead(notification.id);

    const { target } = notification;
    if (!target) return;

    resolving.current = true;
    const gone = await resolveGone(notification).finally(() => {
      resolving.current = false;
    });

    // 확인 중에 이 화면을 떠났다 — 이동도 안내도 하지 않는다.
    if (gone === "cancelled") return;
    if (gone) {
      toast.show(inboxGoneMessage(gone));
      return;
    }
    if (target.kind === "post") openPostDetail(target.postId);
    else openBalanceDetail(target.contentId);
  }

  return (
    <>
      <InboxAppBar
        canMarkAllRead={unreadCount > 0 && !markAllPending}
        onMarkAllRead={() => void markAllRead()}
      />

      {notifications.length === 0 ? (
        <InboxEmptyState />
      ) : (
        <>
          <p className="flex h-11 items-center pl-5 text-label-m font-normal text-text-secondary">
            새 알림
            <span className="ml-1.5 text-interactive-primary">
              {unreadCount}
            </span>
          </p>

          <ul>
            {notifications.map((notification) => (
              <InboxItem
                key={notification.id}
                notification={notification}
                onPress={(item) => void handlePress(item)}
              />
            ))}
          </ul>

          {/* 높이 47 고정 · 마지막 셀과 21 · 아래 여백 0(하단 safe-area도 두지 않는다 — 디자인 확정). */}
          <p className="mt-[21px] flex h-[47px] items-center justify-center px-4 text-label-m font-normal text-text-secondary">
            최근 {INBOX_RETENTION_DAYS}일 이내 알림만 보여요
          </p>
        </>
      )}
    </>
  );
}
