import type { ReactNode } from "react";

import { RefreshOnLogin } from "@/features/auth/presentation/refresh-on-login";
import { SessionExpiredRecovery } from "@/features/auth/presentation/session-expired-recovery";
import {
  getInboxPageData,
  type InboxPageDataResult,
} from "@/features/community/application/get-inbox-page-data";
import { EmptyState } from "@/shared/ui/empty-state";
import { FeedErrorState } from "@/features/community/presentation/feed-error-state";
import { InboxAppBar } from "@/features/community/presentation/notifications/inbox-app-bar";
import { InboxView } from "@/features/community/presentation/notifications/inbox-view";
import { SubviewScrollShell } from "@/features/community/presentation/subview-scroll-shell";
import { NativePageReady } from "@/shared/lib/native-bridge";

/**
 * 알림함 화면 루트 (서버 컴포넌트) — /community/notifications (#187).
 *
 * 목록은 서버에서 읽고(get-inbox-page-data → GET /notice), 읽음 처리는 InboxView가 BFF로 저장한다.
 *
 * 분기 (내 커뮤니티 활동과 같은 방식):
 * - guest: 로그인 전용 API를 부르지 않고 안내만. 로그인하면 SSR을 다시 돌린다(RefreshOnLogin).
 * - session-expired: 네이티브 갱신 후 SSR 재실행(SessionExpiredRecovery).
 * - error: 메인 피드 에러 화면(재시도 = router.refresh).
 * 목록이 없는 분기도 앱바는 그린다(뒤로가기가 있어야 빠져나갈 수 있다) — "모두 읽음"은 비활성.
 *
 * 바탕은 True White — 읽은 셀이 흰 바탕이라 화면 바탕도 같은 흰색이다(안 읽은 셀만 연한 파랑).
 * 앱에서 서브뷰로 열려 문서 스크롤이 막히므로 SubviewScrollShell이 스크롤한다(#200).
 */
export async function InboxScreen() {
  const result = await getInboxPageData();

  return (
    <SubviewScrollShell className="bg-[var(--bw-true-white)]">
      {renderContent(result)}
    </SubviewScrollShell>
  );
}

function renderContent(result: InboxPageDataResult): ReactNode {
  if (result.ok) {
    return (
      <>
        <InboxView
          initialNotifications={result.notifications}
          competitionAlertSettings={result.competitionAlertSettings}
        />
        {/* 다 그려지면 앱이 그림·글꼴을 다 받기 전에 로딩 덮개를 걷는다(jiu-jitsu-ios#261).
            조회에 성공한 화면(빈 목록 포함)에서만 보낸다 — 만료 복구·오류·비로그인 화면은 load 때 걷힌다. */}
        <NativePageReady />
      </>
    );
  }

  if (result.reason === "guest") {
    return (
      <>
        <InboxAppBar canMarkAllRead={false} />
        <RefreshOnLogin />
        <EmptyState title="로그인 후 이용할 수 있어요" className="pt-[35vh]" />
      </>
    );
  }

  if (result.reason === "session-expired") {
    return (
      <>
        <InboxAppBar canMarkAllRead={false} />
        <SessionExpiredRecovery loading={<InboxLoading />} />
      </>
    );
  }

  return (
    <>
      <InboxAppBar canMarkAllRead={false} />
      {/* 앱바가 있어 뷰포트 전체 높이를 쓰면 그만큼 스크롤이 생긴다 → 60vh로 줄인다. */}
      <FeedErrorState className="min-h-[60vh]" />
    </>
  );
}

/** 세션 복구(갱신) 중 표시 — 내 커뮤니티 활동 복구 로딩과 같은 모양. */
function InboxLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <span
        className="size-6 animate-spin rounded-full border-2 border-feed-card-header-avatar-bg border-t-transparent"
        role="status"
        aria-label="불러오는 중"
      />
    </div>
  );
}
