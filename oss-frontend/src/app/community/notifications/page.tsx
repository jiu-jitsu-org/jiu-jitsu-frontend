import { InboxScreen } from "@/features/community/presentation/notifications/inbox-screen";
import { readServerNow } from "@/shared/lib/time";
import { ServerClockProvider } from "@/shared/ui/server-clock";

/**
 * 커뮤니티 알림함 라우트 (얇은 엔트리) — /community/notifications (#187).
 *
 * 앱(iOS/Android)은 커뮤니티 GNB 종 아이콘을 누르면 이 URL을 상세 웹뷰로 push만 하고,
 * 화면은 웹이 전부 그린다. 렌더는 InboxScreen(feature)에 위임한다.
 *
 * ?preview=empty — 목 데이터 단계에서 빈 화면을 확인하는 임시 스위치. API 연동 때 지운다.
 */
export default async function CommunityNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string | string[] }>;
}) {
  const { preview } = await searchParams;
  const now = readServerNow();

  return (
    // 알림 시간("5분 전")을 서버 시각 기준으로 계산하고 60초마다 갱신한다(#188).
    <ServerClockProvider serverNow={now}>
      <InboxScreen empty={preview === "empty"} now={now} />
    </ServerClockProvider>
  );
}
