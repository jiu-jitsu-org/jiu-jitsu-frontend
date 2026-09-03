import type { ReactNode } from "react";

import { getBalanceGamePageData } from "@/features/community/application/get-balance-game-page-data";
import { getBoardListPageData } from "@/features/community/application/get-board-list-page-data";
import { SessionExpiredRecovery } from "@/features/auth/presentation/session-expired-recovery";
import type { BalanceGame } from "@/features/community/domain/balance-game";
import { DEFAULT_BOARD_LIST_QUERY } from "@/features/community/domain/post-summary";
import { BalanceGameSection } from "@/features/community/presentation/balance/balance-game-section";
import { CommunityFeedList } from "@/features/community/presentation/community-feed-list";
import { FeedEmptyState } from "@/features/community/presentation/feed-empty-state";
import { FeedErrorState } from "@/features/community/presentation/feed-error-state";
import { PostWriteFab } from "@/features/community/presentation/post-write-fab";

/**
 * 메인 화면 — 커뮤니티 게시글 피드.
 *
 * 목록과 오늘의 밸런스 게임을 **병렬로** 조회한다. 순차로 부르면 밸런스 조회만큼 첫 페인트가
 * 늦고, 나중에 붙이면 카드가 뒤늦게 끼어들어 목록이 아래로 밀린다.
 *
 * Server Component가 초기 목록을 조회(GET /board)해 FeedCard 목록으로 렌더한다.
 * 데이터 조회는 application page data query에 위임하고(page는 라우팅/조립만),
 * 로딩은 같은 라우트의 loading.tsx, 카드 상호작용은 client 컴포넌트가 담당한다.
 * 개발용 진입 허브/playground는 `src/app/_backup/`에 보관돼 있다.
 */
export default async function Home() {
  const [result, balanceGame] = await Promise.all([
    getBoardListPageData(DEFAULT_BOARD_LIST_QUERY),
    getBalanceGamePageData(),
  ]);

  return (
    <main className="feed-bounce-scroll min-h-screen bg-[var(--bw-white)]">
      {renderFeed(result, balanceGame)}

      {/* 게시글 작성 진입 FAB — 네이티브면 OPEN_SUBVIEW로 풀스크린 서브뷰, 웹 단독이면 라우터 이동. */}
      <PostWriteFab />
    </main>
  );
}

/**
 * 조회 결과를 화면 상태로 매핑한다.
 * - session-expired: 서버는 토큰 갱신 불가 → 클라이언트가 네이티브 갱신 후 SSR을 재실행(복구).
 *   익명으로 격하하지 않아 네이티브 로그인 세션과 어긋나지 않는다.
 * - error: 그 외 조회 실패 → 재시도 화면.
 */
function renderFeed(
  result: Awaited<ReturnType<typeof getBoardListPageData>>,
  balanceGame: BalanceGame | null,
): ReactNode {
  if (!result.ok) {
    if (result.reason === "session-expired") {
      return (
        <SessionExpiredRecovery
          loading={<FeedLoading />}
          fallback={<FeedErrorState />}
        />
      );
    }
    return <FeedErrorState />;
  }

  // 밸런스 카드는 피드가 정상일 때만 얹는다 — 에러·복구 화면 위에 얹으면 "무엇이 실패했는지"가
  // 흐려진다. 진행 중인 판이 없거나 조회에 실패했으면(null) 아무것도 그리지 않는다.
  const balance = balanceGame ? (
    <BalanceGameSection initialGame={balanceGame} />
  ) : null;

  if (result.data.list.items.length === 0) {
    return (
      <>
        {balance}
        <FeedEmptyState />
      </>
    );
  }

  return (
    <>
      {balance}
      <CommunityFeedList
        posts={result.data.list.items}
        page={result.data.list.page}
        isLast={result.data.list.isLast}
      />
    </>
  );
}

/** 피드 복구(세션 갱신) 중 표시. */
function FeedLoading() {
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
