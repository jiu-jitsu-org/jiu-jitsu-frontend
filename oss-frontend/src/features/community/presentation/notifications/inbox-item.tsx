"use client";

import { useId, type ReactNode } from "react";

import type { InboxNotification } from "@/features/community/domain/inbox-notification";
import { inboxTitle } from "@/features/community/presentation/notifications/inbox-copy";
import { cn } from "@/shared/lib/cn";
import { ChatBubbleIcon, HeartIcon } from "@/shared/ui/icons";
import { RelativeTime } from "@/shared/ui/relative-time";

/** 커뮤니티 알림 셀 — 종류별 아이콘·문구만 정하고 모양은 InboxItemShell이 그린다. */
export function InboxItem({
  notification,
  onPress,
}: {
  notification: InboxNotification;
  onPress: (notification: InboxNotification) => void;
}) {
  const isLike =
    notification.type === "CONTENTS_LIKE" ||
    notification.type === "COMMENTS_LIKE";
  return (
    <InboxItemShell
      isRead={notification.isRead}
      icon={
        isLike ? (
          <HeartIcon filled size={18} />
        ) : (
          <ChatBubbleIcon filled size={18} />
        )
      }
      iconTone={isLike ? "like" : "comment"}
      title={inboxTitle(notification)}
      body={notification.body}
      createdAt={notification.createdAt}
      onPress={() => onPress(notification)}
    />
  );
}

/**
 * 아이콘 상자 색 — 종류마다 연한 바탕 + 꽉 찬 아이콘. 읽음 여부와 상관없이 같다(읽음은 줄 바탕으로만 가른다).
 * 댓글 = 파랑, 좋아요 = 연한 핑크 + 빨강 하트(리액션 바의 눌린 하트와 같은 색), 대회 마감 = 주황.
 * 상자 32 · 아이콘 18 — 꽉 찬 아이콘은 선 아이콘보다 무거워 보여 36·20에서 한 단계 줄였다.
 */
export const INBOX_ICON_TONE = {
  comment: "bg-[var(--blue-50)] text-interactive-primary",
  like: "bg-[var(--red-balance-50)] text-reaction-bar-active-like-icon",
  competition:
    "bg-[color-mix(in_srgb,var(--orange-500)_12%,var(--bw-true-white))] text-[var(--orange-500)]",
} as const;

export type InboxIconTone = keyof typeof INBOX_ICON_TONE;

/**
 * 알림 셀 껍데기 — 아이콘 + (타이틀 · 시간) + 본문. 커뮤니티 알림과 대회 마감 알림(#377)이 같은 모양을 쓴다.
 *
 * 안 읽음: 줄 바탕을 연한 파랑으로 깐다(파랑 50을 흰색과 반쯤 섞음 — 댓글 아이콘 상자와 겹쳐 묻히지 않게).
 * 읽음:   흰 바탕. 글자·아이콘 색은 둘이 같다 — 구분은 바탕 하나로만 한다.
 * 시간은 타이틀 첫 줄 오른쪽 끝에 둔다 — 시간 줄을 따로 두지 않아 셀 높이가 줄어든다. 타이틀은 두 줄까지, 본문은 한 줄.
 * 줄 사이 구분선은 두지 않는다 — 안 읽은 줄은 바탕색, 읽은 줄끼리는 위아래 여백으로 갈린다.
 *
 * 셀 전체가 눌리는 자리다 — 타이틀 버튼의 누름 자리를 셀 크기로 넓혔다(after 겹침). 본문 아래(trailing)에
 * 따로 눌리는 글자 버튼을 둘 수 있다(대회 알림의 '이 대회 알림 받지 않기') — 버튼 안에 버튼을 넣을 수 없어서다.
 * 시간은 공통 상대 시간 규칙(RelativeTime, #188)이라 60초마다 · 포그라운드 복귀 시 다시 계산된다.
 * 본문이 비어 오면 줄을 통째로 뺀다 — 빈 줄을 남기면 셀 높이만 들쭉날쭉해진다.
 */
export function InboxItemShell({
  isRead,
  icon,
  iconTone,
  title,
  body,
  createdAt,
  onPress,
  trailing,
}: {
  isRead: boolean;
  icon: ReactNode;
  iconTone: InboxIconTone;
  title: string;
  body?: string;
  createdAt: string;
  onPress: () => void;
  trailing?: ReactNode;
}) {
  const bodyId = useId();
  return (
    <li
      className={cn(
        "relative flex w-full items-start gap-3 px-4 py-4 text-left",
        isRead
          ? "bg-[var(--bw-true-white)]"
          : "bg-[color-mix(in_srgb,var(--blue-50)_55%,var(--bw-true-white))]",
      )}
    >
      <span
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-10",
          INBOX_ICON_TONE[iconTone],
        )}
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        {/* 타이틀은 두 줄까지 — 대회 이름이 들어간 서버 문구처럼 길면 한 줄 말줄임으로는 뜻이 잘린다.
            시간은 첫 줄 오른쪽에 붙는다(items-start + 첫 줄 높이 24에 맞춘 위 여백 4). */}
        <span className="flex items-start gap-2">
          <button
            type="button"
            onClick={onPress}
            aria-describedby={body ? bodyId : undefined}
            className="line-clamp-2 min-w-0 flex-1 text-left text-body-m font-semibold text-text-primary outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-border-focus focus-visible:after:ring-inset"
          >
            {title}
            {isRead ? null : <span className="sr-only">, 안 읽음</span>}
          </button>
          <span className="mt-1 shrink-0 text-label-m font-normal text-text-disabled">
            <RelativeTime iso={createdAt} />
          </span>
        </span>
        {body ? (
          <span
            id={bodyId}
            className="mt-1 block truncate text-body-s font-normal text-text-secondary"
          >
            {body}
          </span>
        ) : null}
        {trailing ? (
          <span className="relative mt-2 flex">{trailing}</span>
        ) : null}
      </span>
    </li>
  );
}
