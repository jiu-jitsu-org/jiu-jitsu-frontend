"use client";

import type { InboxNotification } from "@/features/community/domain/inbox-notification";
import { inboxTitle } from "@/features/community/presentation/notifications/inbox-copy";
import { cn } from "@/shared/lib/cn";
import { CommentIcon, HeartIcon } from "@/shared/ui/icons";
import { RelativeTime } from "@/shared/ui/relative-time";

/**
 * 알림 셀 — 아이콘 + 타이틀 + 본문 + 시간.
 *
 * 안 읽음: 파란 아이콘 · 흰 바탕 · "● 5분 전"
 * 읽음:   회색 아이콘 · 회색 바탕 · "읽음 · 1일 전"
 *
 * 시간은 공통 상대 시간 규칙(RelativeTime, #188)이라 60초마다 · 포그라운드 복귀 시 다시 계산된다.
 * 본문이 비어 오면 줄을 통째로 뺀다 — 빈 줄을 남기면 셀 높이만 들쭉날쭉해진다.
 */
export function InboxItem({
  notification,
  onPress,
}: {
  notification: InboxNotification;
  onPress: (notification: InboxNotification) => void;
}) {
  const { isRead } = notification;

  return (
    <li className="border-b border-border-subtle">
      <button
        type="button"
        onClick={() => onPress(notification)}
        className={cn(
          "flex w-full items-start gap-3 px-4 py-4 text-left",
          isRead ? "bg-surface-container" : "bg-[var(--bw-true-white)]",
        )}
      >
        <span
          className={cn(
            "inline-flex size-9 shrink-0 items-center justify-center rounded-[10px]",
            isRead
              ? "bg-surface-secondary text-icon-secondary"
              : "bg-primary-faint text-primary",
          )}
        >
          <InboxTypeIcon type={notification.type} />
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate text-body-m font-semibold",
              isRead ? "text-text-secondary" : "text-text-primary",
            )}
          >
            {inboxTitle(notification)}
          </span>
          {notification.body ? (
            <span className="mt-0.5 block truncate text-body-s text-text-secondary">
              {notification.body}
            </span>
          ) : null}
          <span className="mt-1 flex items-center gap-1 text-label-m text-text-secondary">
            {isRead ? (
              <span>
                읽음 · <RelativeTime iso={notification.createdAt} />
              </span>
            ) : (
              <>
                <span aria-hidden className="size-1 rounded-full bg-primary" />
                <span className="sr-only">안 읽음</span>
                <RelativeTime iso={notification.createdAt} />
              </>
            )}
          </span>
        </span>
      </button>
    </li>
  );
}

/** 댓글 계열은 말풍선, 좋아요 계열은 하트(디자인에 없는 종류 — 노출 여부 기획 확인 중). */
function InboxTypeIcon({ type }: { type: InboxNotification["type"] }) {
  if (type === "CONTENTS_LIKE" || type === "COMMENTS_LIKE") {
    return <HeartIcon size={20} />;
  }
  return <CommentIcon size={20} />;
}
