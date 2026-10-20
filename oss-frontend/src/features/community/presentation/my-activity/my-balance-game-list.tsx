"use client";

import type { BalanceGame } from "@/features/community/domain/balance-game";
import {
  FeedLoadingMore,
  FeedLoadMoreError,
} from "@/features/community/presentation/community-feed-list";
import { FeedListEnd } from "@/features/community/presentation/feed/feed-list-end";
import { MyBalanceGameItem } from "@/features/community/presentation/my-activity/my-balance-game-item";
import { useMyBalanceGameFeed } from "@/features/community/presentation/my-activity/use-my-balance-game-feed";
import { useInfiniteScroll } from "@/features/community/presentation/use-infinite-scroll";

/**
 * 참여한 밸런스 게임 목록(무한 스크롤) — 내 커뮤니티 활동 '밸런스 게임' 탭.
 *
 * 최신 판이 먼저이고 마감된 판도 있다. 항목을 누르면 상세(/community/balance/{contentId})가 열린다
 * — 상세는 마감된 판도 그대로 보여준다. 목록에서는 투표하지 않는다.
 *
 * 간격: 탭 아래 16(pt-4), 좌우 16(px-4), 항목 사이 28(gap-7), 구분선 없음.
 * 아래 상태 줄(로딩 · 재시도 · 끝 표식)은 메인 피드와 같은 모양이다.
 */
export function MyBalanceGameList({
  games,
  isLast: initialIsLast,
  page,
}: {
  games: BalanceGame[];
  page: number;
  isLast: boolean;
}) {
  const { items, isLast, status, loadMore } = useMyBalanceGameFeed({
    items: games,
    page,
    isLast: initialIsLast,
  });

  // 에러 상태에선 자동 재요청을 멈추고, 사용자가 재시도 버튼으로만 다시 시도하게 한다(피드와 같다).
  const sentinelRef = useInfiniteScroll({
    onReach: loadMore,
    enabled: !isLast && status !== "error",
    resetKey: items.length,
  });

  return (
    <div className="flex flex-col pt-4 pb-[env(safe-area-inset-bottom)]">
      <ul className="flex flex-col gap-7 px-4">
        {items.map((game) => (
          <li key={game.contentId}>
            <MyBalanceGameItem game={game} />
          </li>
        ))}
      </ul>

      {!isLast && status !== "error" ? (
        <div ref={sentinelRef} aria-hidden className="h-px" />
      ) : null}

      {status === "loading" ? (
        <FeedLoadingMore label="밸런스 게임 불러오는 중" />
      ) : null}
      {status === "error" ? (
        <FeedLoadMoreError
          onRetry={loadMore}
          message="밸런스 게임을 더 불러오지 못했어요"
        />
      ) : null}
      {isLast ? <FeedListEnd /> : null}
    </div>
  );
}
