"use client";

import type { InboxNotification } from "@/features/community/domain/inbox-notification";
import { inboxTitle } from "@/features/community/presentation/notifications/inbox-copy";
import { cn } from "@/shared/lib/cn";
import { ChatBubbleIcon, HeartIcon } from "@/shared/ui/icons";
import { RelativeTime } from "@/shared/ui/relative-time";

/**
 * 알림 셀 — 아이콘 + 타이틀 + 본문 + 시간.
 *
 * 안 읽음: 파란 아이콘 · 흰 바탕 · "● 5분 전"(점 5 · 간격 6)
 * 읽음:   회색 아이콘 · 회색 바탕 · "읽음 · 1일 전"(점 2 · 간격 4)
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
    <li>
      {/* 구분선은 inside 1 — 셀 높이에 더하지 않고 하단 패딩(24) 위에 겹쳐 그린다. */}
      <button
        type="button"
        onClick={() => onPress(notification)}
        className={cn(
          "flex w-full items-start gap-3 px-4 pt-3 pb-6 text-left shadow-[inset_0_-1px_0_var(--border-subtle)]",
          isRead ? "bg-surface-container" : "bg-[var(--bw-true-white)]",
        )}
      >
        <span
          className={cn(
            "inline-flex size-9 shrink-0 items-center justify-center rounded-xl",
            isRead
              ? "bg-surface-secondary text-icon-tertiary"
              : "bg-[var(--blue-50)] text-interactive-primary",
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
            <span
              className={cn(
                "mt-[5px] block truncate text-body-s font-normal",
                isRead ? "text-text-disabled" : "text-text-secondary",
              )}
            >
              {notification.body}
            </span>
          ) : null}
          <span
            className={cn(
              "mt-[5px] flex items-center text-label-m font-normal text-text-disabled",
              isRead ? "gap-1" : "gap-1.5",
            )}
          >
            {isRead ? (
              <>
                읽음
                <span aria-hidden className="size-0.5 rounded-full bg-current" />
                <RelativeTime iso={notification.createdAt} />
              </>
            ) : (
              <>
                <span
                  aria-hidden
                  className="size-[5px] rounded-full bg-interactive-primary"
                />
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
  return <ChatBubbleIcon size={20} />;
}
