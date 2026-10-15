import { createInboxMock } from "@/features/community/presentation/notifications/inbox-mock";
import { InboxView } from "@/features/community/presentation/notifications/inbox-view";

/**
 * 알림함 화면 루트 (서버 컴포넌트) — /community/notifications (#187).
 *
 * 지금은 목 데이터로 그린다. API 연동 때 get-inbox-page-data(GET /notice)로 바꾸고,
 * 내 커뮤니티 활동(MyActivityScreen)처럼 guest · session-expired · error 분기를 붙인다.
 *
 * 바탕은 True White — 안 읽은 셀(흰색)과 읽은 셀(회색)의 대비가 디자인의 핵심이라 화면 바탕도 흰색이다.
 */
export function InboxScreen({ empty, now }: { empty: boolean; now: number }) {
  const notifications = empty ? [] : createInboxMock(now);

  return (
    <main className="min-h-screen bg-[var(--bw-true-white)]">
      <InboxView initialNotifications={notifications} />
    </main>
  );
}
