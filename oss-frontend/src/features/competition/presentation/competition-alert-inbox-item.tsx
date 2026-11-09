"use client";

import { InboxItemShell } from "@/features/community/presentation/notifications/inbox-item";
import {
  deadlineAlertBody,
  deadlineAlertTitle,
  type CompetitionAlertNotification,
} from "@/features/competition/domain/competition-alert";
import { CalendarIcon } from "@/shared/ui/icons";

/**
 * 알림함의 대회 마감 알림 줄 (#377) — 커뮤니티 알림과 같은 셀, 아이콘만 달력.
 *
 * "얼리버드 마감 내일 / 서울 오픈 챔피언십 얼리버드가 내일 끝나요". 누르면 읽음 처리 후 대회 상세로 간다(호출부).
 * 시간 줄 오른쪽 끝의 '이 대회 알림 받지 않기'는 관심은 두고 이 대회 알림만 끈다 — 대회 상세의 종과 같은 값(#376).
 * 끈 뒤에는 같은 자리가 '이 대회 알림 다시 받기'가 되어 바로 되돌릴 수 있다.
 * muted가 null이면(설정을 못 읽음) 글자 버튼을 두지 않는다.
 */
export function CompetitionAlertInboxItem({
  notification,
  muted,
  onPress,
  onToggleMuted,
}: {
  notification: CompetitionAlertNotification;
  muted: boolean | null;
  onPress: () => void;
  onToggleMuted: () => void;
}) {
  return (
    <InboxItemShell
      isRead={notification.isRead}
      icon={<CalendarIcon size={20} />}
      title={deadlineAlertTitle(notification.kind)}
      body={deadlineAlertBody(notification.competitionName, notification.kind)}
      createdAt={notification.createdAt}
      onPress={onPress}
      trailing={
        muted === null ? null : (
          <button
            type="button"
            onClick={onToggleMuted}
            className="-my-1.5 rounded-10 px-1.5 py-1.5 text-label-m font-medium text-text-secondary active:bg-surface-container-pressed"
          >
            {muted ? "이 대회 알림 다시 받기" : "이 대회 알림 받지 않기"}
          </button>
        )
      }
    />
  );
}
