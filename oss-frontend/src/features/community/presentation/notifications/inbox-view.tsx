"use client";

import { useMemo, useRef, useState } from "react";

import {
  INBOX_RETENTION_DAYS,
  type InboxNotification,
} from "@/features/community/domain/inbox-notification";
import { useOpenBalanceDetail } from "@/features/community/presentation/balance/use-open-balance-detail";
import { InboxAppBar } from "@/features/community/presentation/notifications/inbox-app-bar";
import { InboxEmptyState } from "@/features/community/presentation/notifications/inbox-empty-state";
import { inboxGoneMessage } from "@/features/community/presentation/notifications/inbox-copy";
import { InboxItem } from "@/features/community/presentation/notifications/inbox-item";
import { useOpenPostDetail } from "@/features/community/presentation/use-open-post-detail";
import type { CompetitionAlertInbox } from "@/features/competition/application/load-competition-alert-inbox";
import type { CompetitionAlertNotification } from "@/features/competition/domain/competition-alert";
import { markCompetitionAlertsReadAction } from "@/features/competition/presentation/actions/competition-alert-actions";
import {
  CompetitionAlertProvider,
  useCompetitionAlerts,
} from "@/features/competition/presentation/competition-alert-provider";
import { CompetitionAlertInboxItem } from "@/features/competition/presentation/competition-alert-inbox-item";
import { useOpenCompetitionDetail } from "@/features/competition/presentation/competition-detail-link";
import { bffFetch } from "@/shared/lib/http/bff-fetch";
import { toKstDateKey } from "@/shared/lib/time";
import { usePendingToast, useToast } from "@/shared/ui";
import { useServerNow } from "@/shared/ui/server-clock";

/**
 * 알림함 화면 본체 (클라이언트) — 목록 · 읽음 처리 · 상세 이동.
 *
 * 셀 탭: 읽음으로 바꾸고(낙관적) 대상 상세를 연다. 저장(PUT /api/community/notifications/{id})은
 *   이동과 병렬로 보내고, 실패하면 조용히 안 읽음으로 되돌린다 — 사용자는 이미 상세로 넘어가
 *   토스트가 엉뚱한 화면에 뜬다. 앱에서는 OPEN_SUBVIEW로 상세가 위에 쌓이고 이 화면은 그대로 살아 있어,
 *   돌아왔을 때 읽음 상태가 유지된다.
 * 삭제된 대상: 이동하지 않고 이 화면에 머물러 알림함 문구(inbox-copy)로 토스트를 띄운다. 읽음 처리는 같다.
 *   목록에서 빼지 않는다 — 알림 자체는 사실이고, 30일이 지나면 서버가 내린다.
 *   삭제 여부는 목록 응답의 서버 값(notification.gone)만 본다.
 *   밸런스 게임 자체가 없어진 경우는 예외로 상세에 보낸다 — 상세(BalanceDetailGone)의
 *   "종료된 밸런스 게임이에요"가 맞는 문구라 알림함 "삭제된 게시글이에요"를 쓰지 않는다.
 * 모두 읽음: 전체를 읽음으로 바꾸고(낙관적) PUT /api/community/notifications로 저장한다.
 *   실패하면 그때 안 읽음이던 것만 되돌리고 토스트로 알린다(이 화면에 머물러 있으니 알려야 한다).
 *
 * 대회 마감 알림(#377): 커뮤니티 알림과 한 목록에 최신순으로 섞는다(종류는 아이콘으로 구분). 누르면 읽음 처리 후
 *   대회 상세로 가고, 읽음 저장은 대회 feature의 Server Action이 한다. 모두 읽음·새 알림 수에도 함께 든다.
 *   줄의 '이 대회 알림 받지 않기'는 대회 상세의 알림 종과 같은 값이다(#376).
 *
 * 목록을 받은 뒤에 지워져 상세까지 들어간 경우(와 위의 밸런스 게임)는 상세(PostDetailGone · BalanceDetailGone)가
 * 문구를 남기고 닫히고, 돌아온 이 화면이 usePendingToast로 받아 띄운다 — 피드와 같은 공용 경로다.
 */
export function InboxView({
  initialNotifications,
  competition,
}: {
  initialNotifications: InboxNotification[];
  competition: CompetitionAlertInbox;
}) {
  const today = toKstDateKey(useServerNow());
  return (
    <CompetitionAlertProvider settings={competition.settings} today={today}>
      <InboxList
        initialNotifications={initialNotifications}
        initialCompetitionAlerts={competition.notifications}
      />
    </CompetitionAlertProvider>
  );
}

type InboxEntry =
  | { kind: "community"; item: InboxNotification }
  | { kind: "competition"; item: CompetitionAlertNotification };

function InboxList({
  initialNotifications,
  initialCompetitionAlerts,
}: {
  initialNotifications: InboxNotification[];
  initialCompetitionAlerts: CompetitionAlertNotification[];
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [competitionAlerts, setCompetitionAlerts] = useState(
    initialCompetitionAlerts,
  );
  const alerts = useCompetitionAlerts();
  const openCompetitionDetail = useOpenCompetitionDetail();
  const [markAllPending, setMarkAllPending] = useState(false);
  const openPostDetail = useOpenPostDetail();
  const openBalanceDetail = useOpenBalanceDetail();
  const toast = useToast();
  usePendingToast();

  const unreadCount =
    notifications.filter((item) => !item.isRead).length +
    competitionAlerts.filter((item) => !item.isRead).length;

  // 커뮤니티 알림과 대회 알림을 최신순으로 섞는다. 시각은 둘 다 오프셋이 붙은 ISO라 시각 값으로 비교한다.
  const entries = useMemo<InboxEntry[]>(
    () =>
      [
        ...notifications.map((item) => ({ kind: "community" as const, item })),
        ...competitionAlerts.map((item) => ({
          kind: "competition" as const,
          item,
        })),
      ].sort(
        (a, b) => Date.parse(b.item.createdAt) - Date.parse(a.item.createdAt),
      ),
    [competitionAlerts, notifications],
  );

  function setCompetitionReadState(ids: ReadonlySet<string>, isRead: boolean) {
    setCompetitionAlerts((items) =>
      items.map((item) => (ids.has(item.id) ? { ...item, isRead } : item)),
    );
  }

  // 모두 읽음이 성공한 대회 알림 — 하나 읽기가 늦게 실패해도 이것들은 안 읽음으로 되돌리지 않는다.
  const competitionReadByAll = useRef(new Set<string>());

  async function markCompetitionRead(id: string) {
    const ids = new Set([id]);
    setCompetitionReadState(ids, true);
    const result = await markCompetitionAlertsReadAction([id]).catch(
      () => null,
    );
    if (!result?.ok && !competitionReadByAll.current.has(id)) {
      setCompetitionReadState(ids, false);
    }
  }

  function handleCompetitionPress(notification: CompetitionAlertNotification) {
    if (!notification.isRead) void markCompetitionRead(notification.id);
    openCompetitionDetail(notification.competitionId);
  }

  async function toggleCompetitionMuted(competitionId: string) {
    if (!alerts) return;
    const muted = !alerts.isMuted(competitionId);
    if (await alerts.setMuted(competitionId, muted)) {
      toast.show(
        muted ? "이 대회의 알림을 받지 않아요" : "이 대회의 알림을 받아요",
        { tone: "info" },
      );
    }
  }

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
    const competitionIds = new Set(
      competitionAlerts.filter((item) => !item.isRead).map((item) => item.id),
    );
    setReadState(ids, true);
    setCompetitionReadState(competitionIds, true);
    setMarkAllPending(true);

    // 안 읽은 것이 있는 쪽만 저장한다 — 커뮤니티와 대회 알림은 저장하는 곳이 다르다.
    const [communityOk, competitionOk] = await Promise.all([
      ids.size === 0
        ? true
        : bffFetch("/api/community/notifications", { method: "PUT" })
            .then((response) => response.ok)
            .catch(() => false),
      competitionIds.size === 0
        ? true
        : markCompetitionAlertsReadAction()
            .then((result) => result.ok)
            .catch(() => false),
    ]);
    setMarkAllPending(false);

    if (!communityOk) setReadState(ids, false);
    if (competitionOk) {
      for (const id of competitionIds) competitionReadByAll.current.add(id);
    } else {
      setCompetitionReadState(competitionIds, false);
    }
    if (!communityOk || !competitionOk) {
      toast.show("알림을 읽음 처리하지 못했어요", { tone: "error" });
    }
  }

  function handlePress(notification: InboxNotification) {
    if (!notification.isRead) void markRead(notification.id);

    const { target, gone } = notification;
    if (!target) return;

    const balanceGone = target.kind === "balance" && gone === "post";
    if (gone && !balanceGone) {
      toast.show(inboxGoneMessage(gone), { tone: "info" });
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

      {entries.length === 0 ? (
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
            {entries.map((entry) =>
              entry.kind === "community" ? (
                <InboxItem
                  key={`community-${entry.item.id}`}
                  notification={entry.item}
                  onPress={handlePress}
                />
              ) : (
                <CompetitionAlertInboxItem
                  key={`competition-${entry.item.id}`}
                  notification={entry.item}
                  muted={
                    alerts?.available
                      ? alerts.isMuted(entry.item.competitionId)
                      : null
                  }
                  onPress={() => handleCompetitionPress(entry.item)}
                  onToggleMuted={() =>
                    void toggleCompetitionMuted(entry.item.competitionId)
                  }
                />
              ),
            )}
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
