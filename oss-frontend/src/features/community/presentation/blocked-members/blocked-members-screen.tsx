import type { ReactNode } from "react";

import { RefreshOnLogin } from "@/features/auth/presentation/refresh-on-login";
import { SessionExpiredRecovery } from "@/features/auth/presentation/session-expired-recovery";
import type { BlockedMembersSampleMode } from "@/features/community/application/blocked-members-sample";
import {
  getBlockedMembersPageData,
  type BlockedMembersPageDataResult,
} from "@/features/community/application/get-blocked-members-page-data";
import { BlockedMembersAppBar } from "@/features/community/presentation/blocked-members/blocked-members-app-bar";
import { BlockedMembersView } from "@/features/community/presentation/blocked-members/blocked-members-view";
import { EmptyState } from "@/features/community/presentation/empty-state";
import { FeedErrorState } from "@/features/community/presentation/feed-error-state";
import { SubviewScrollShell } from "@/features/community/presentation/subview-scroll-shell";
import { Spinner } from "@/shared/ui";

/**
 * 차단한 회원 화면 루트 (서버 컴포넌트) — /community/blocked-users.
 *
 * 앱 설정의 "차단한 회원" 줄이 이 URL을 서브뷰(OPEN_SUBVIEW)로 연다. 목록은 서버에서 읽고
 * (get-blocked-members-page-data → GET /user/block), 해제는 BlockedMembersView가 BFF로 보낸다.
 *
 * 분기 (알림함과 같은 방식):
 * - guest: 로그인 전용 API를 부르지 않고 안내만. 로그인하면 SSR을 다시 돌린다(RefreshOnLogin).
 * - session-expired: 네이티브 갱신 후 SSR 재실행(SessionExpiredRecovery).
 * - error: 메인 피드 에러 화면(재시도 = router.refresh). 목록 API가 아직 없어 404도 여기로 온다.
 * 목록이 없는 분기도 앱바는 그린다(뒤로가기가 있어야 빠져나갈 수 있다).
 *
 * 앱에서 서브뷰로 열려 문서 스크롤이 막히므로 SubviewScrollShell이 스크롤한다(#200).
 */
export async function BlockedMembersScreen({
  sampleMode,
}: {
  sampleMode: BlockedMembersSampleMode | null;
}) {
  const result = await getBlockedMembersPageData(sampleMode);

  return (
    <SubviewScrollShell className="bg-[var(--bw-white)]">
      {renderContent(result)}
    </SubviewScrollShell>
  );
}

function renderContent(result: BlockedMembersPageDataResult): ReactNode {
  if (result.ok) {
    return (
      <BlockedMembersView
        initialMembers={result.members}
        sample={result.sample}
      />
    );
  }

  if (result.reason === "guest") {
    return (
      <>
        <BlockedMembersAppBar />
        <RefreshOnLogin />
        <EmptyState title="로그인 후 이용할 수 있어요" className="pt-[35vh]" />
      </>
    );
  }

  if (result.reason === "session-expired") {
    return (
      <>
        <BlockedMembersAppBar />
        <SessionExpiredRecovery loading={<BlockedMembersLoading />} />
      </>
    );
  }

  return (
    <>
      <BlockedMembersAppBar />
      {/* 앱바가 있어 뷰포트 전체 높이를 쓰면 그만큼 스크롤이 생긴다 → 60vh로 줄인다. */}
      <FeedErrorState className="min-h-[60vh]" />
    </>
  );
}

/** 세션 복구(갱신) 중 표시. */
function BlockedMembersLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner />
    </div>
  );
}
