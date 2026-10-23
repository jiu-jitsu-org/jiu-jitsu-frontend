import type { ReactNode } from "react";

import { RefreshOnLogin } from "@/features/auth/presentation/refresh-on-login";
import { SessionExpiredRecovery } from "@/features/auth/presentation/session-expired-recovery";
import {
  getMyActivityPageData,
  getMyBalanceGamesPageData,
  type MyActivityPageDataResult,
} from "@/features/community/application/get-my-activity-page-data";
import type { PostList } from "@/features/community/domain/post-summary";
import { CommunityFeedList } from "@/features/community/presentation/community-feed-list";
import { EmptyState } from "@/features/community/presentation/empty-state";
import { FeedErrorState } from "@/features/community/presentation/feed-error-state";
import { MyActivityAppBar } from "@/features/community/presentation/my-activity/my-activity-app-bar";
import { MyActivityEmptyState } from "@/features/community/presentation/my-activity/my-activity-empty-state";
import {
  myPostListUrl,
  toMyPostListKind,
  type MyActivityTab,
  type MyPostTab,
} from "@/features/community/presentation/my-activity/my-activity-tab";
import { MyActivityTabs } from "@/features/community/presentation/my-activity/my-activity-tabs";
import { MyBalanceGameList } from "@/features/community/presentation/my-activity/my-balance-game-list";
import { SubviewScrollShell } from "@/features/community/presentation/subview-scroll-shell";
import { Spinner } from "@/shared/ui/spinner";

/**
 * 내 커뮤니티 활동 화면 루트 (서버 컴포넌트) — 내가 쓴 글 · 저장한 글 · 참여한 밸런스 게임(플래그).
 *
 * 상단 프로필과 선택된 탭의 첫 페이지를 서버에서 읽고(get-my-activity-page-data), 목록 상호작용
 * (무한 스크롤 · 좋아요 · 저장 · ⋮)은 메인 피드 목록(CommunityFeedList)을 그대로 쓴다.
 *
 * 분기:
 * - guest: 로그인 전용 API를 부르지 않고 안내만. 로그인하면 SSR을 다시 돌린다(RefreshOnLogin).
 * - session-expired: 메인 피드와 같이 네이티브 갱신 후 SSR 재실행(SessionExpiredRecovery).
 * - error: 메인 피드 에러 화면(재시도 = router.refresh).
 *
 * 앱에서 서브뷰로 열려 문서 스크롤이 막히므로 SubviewScrollShell이 스크롤한다(#200).
 */
export async function MyActivityScreen({ tab }: { tab: MyActivityTab }) {
  // 탭마다 목록 모양이 달라(게시글 · 밸런스 게임) 조회와 패널을 짝지어 고른다. 분기 화면은 공통이다.
  const content =
    tab === "balance"
      ? renderContent(await getMyBalanceGamesPageData(), tab, (list) =>
          list.items.length === 0 ? (
            <MyActivityEmptyState tab={tab} />
          ) : (
            <MyBalanceGameList
              key={tab}
              games={list.items}
              page={list.page}
              isLast={list.isLast}
            />
          ),
        )
      : renderContent(
          await getMyActivityPageData(toMyPostListKind(tab)),
          tab,
          (list) => <MyActivityPanel list={list} tab={tab} />,
        );

  return (
    // 목록 카드(surface-container)가 메인 피드와 같아 보이도록 바탕도 피드와 같은 색을 쓴다.
    <SubviewScrollShell className="bg-[var(--bw-white)]">
      <MyActivityAppBar />
      {content}
    </SubviewScrollShell>
  );
}

function renderContent<L>(
  result: MyActivityPageDataResult<L>,
  tab: MyActivityTab,
  renderPanel: (list: L) => ReactNode,
): ReactNode {
  if (!result.ok) {
    if (result.reason === "guest") {
      return (
        <>
          <RefreshOnLogin />
          <EmptyState
            title="로그인 후 이용할 수 있어요"
            className="pt-[35vh]"
          />
        </>
      );
    }
    if (result.reason === "session-expired") {
      return <SessionExpiredRecovery loading={<MyActivityLoading />} />;
    }
    // 앱바가 있어 뷰포트 전체 높이를 쓰면 그만큼 스크롤이 생긴다 → 60vh로 줄인다.
    return <FeedErrorState className="min-h-[60vh]" />;
  }

  return (
    <>
      <MyActivityTabs tab={tab} profile={result.data.profile}>
        {renderPanel(result.data.list)}
      </MyActivityTabs>
    </>
  );
}

/**
 * 탭 패널 — 목록 또는 빈 상태.
 *
 * key=tab: 탭이 바뀌면 목록을 새로 마운트한다. 같은 자리 같은 컴포넌트라 key가 없으면 React가
 * 이전 탭의 누적 상태(useBoardFeed)를 그대로 들고 간다.
 *
 * 쓴 글은 모든 카드가 내 글이라 작성자 행을 감춘다(hideAuthor). 이 화면 안에서는 내 이름을 눌러
 * 같은 화면을 또 쌓지 않도록 작성자 탭을 끈다(authorLink=false).
 * 목록 시작은 탭 아래 16(pt-1 4 + 카드 눌림 여백 12), 아래는 FAB이 없어 홈 인디케이터 여백만 둔다.
 */
function MyActivityPanel({ list, tab }: { list: PostList; tab: MyPostTab }) {
  if (list.items.length === 0) return <MyActivityEmptyState tab={tab} />;

  return (
    <CommunityFeedList
      key={tab}
      posts={list.items}
      page={list.page}
      isLast={list.isLast}
      listUrl={myPostListUrl(tab)}
      hideAuthor={tab === "posts"}
      authorLink={false}
      className="pt-1 pb-[env(safe-area-inset-bottom)]"
    />
  );
}

/** 세션 복구(갱신) 중 표시 — 메인 피드 복구 로딩과 같은 모양. */
function MyActivityLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner />
    </div>
  );
}
