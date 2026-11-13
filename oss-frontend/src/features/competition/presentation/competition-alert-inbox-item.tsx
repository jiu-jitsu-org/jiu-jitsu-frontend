"use client";

import type { InboxNotification } from "@/features/community/domain/inbox-notification";
import { InboxItemShell } from "@/features/community/presentation/notifications/inbox-item";
import { CalendarIcon } from "@/shared/ui/icons";

/**
 * 알림함의 대회 마감 알림 줄 (#377 · #422) — 커뮤니티 알림과 같은 셀, 아이콘만 주황 달력.
 *
 * 제목·본문은 서버 문구 그대로다. 누르면 읽음 처리 후 대회 상세로 간다(호출부).
 * 본문 아래의 '이 대회 알림 받지 않기'는 관심은 두고 이 대회 알림만 끈다 — 대회 상세의 종과 같은 값(#376).
 * 알림함 응답에는 이 대회 알림이 켜져 있는지가 없어 늘 같은 글자다(이미 꺼져 있어도 같은 결과). 다시 켜기는 대회 상세에서 한다.
 * canMute가 false면(설정을 못 읽음·대회가 지워짐) 글자 버튼을 두지 않는다.
 */
export function CompetitionAlertInboxItem({
  notification,
  canMute,
  onPress,
  onMute,
}: {
  notification: InboxNotification;
  canMute: boolean;
  onPress: () => void;
  onMute: () => void;
}) {
  return (
    <InboxItemShell
      isRead={notification.isRead}
      icon={<CalendarIcon filled size={18} />}
      iconTone="competition"
      title={notification.title}
      body={notification.body}
      createdAt={notification.createdAt}
      onPress={onPress}
      trailing={
        canMute ? (
          <button
            type="button"
            onClick={onMute}
            className="-mx-1.5 -my-1.5 rounded-10 px-1.5 py-1.5 text-label-m font-medium text-text-secondary active:bg-surface-container-pressed"
          >
            이 대회 알림 받지 않기
          </button>
        ) : null
      }
    />
  );
}
