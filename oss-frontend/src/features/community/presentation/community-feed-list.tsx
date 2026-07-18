"use client";

import { useOpenPostDetail } from "@/features/community/presentation/use-open-post-detail";
import { useBoardFeed } from "@/features/community/presentation/use-board-feed";
import { useInfiniteScroll } from "@/features/community/presentation/use-infinite-scroll";
import { usePostActions } from "@/features/community/presentation/use-post-actions";
import type { PostSummary } from "@/features/community/domain/post-summary";
import { FeedCard } from "@/features/community/presentation/feed/feed-card";
import { FeedListEnd } from "@/features/community/presentation/feed/feed-list-end";

/**
 * 커뮤니티 메인 피드 목록(무한 스크롤).
 *
 * community-playground의 FeedCard 쇼케이스를 그대로 재현하되, 데모용 useState 대신
 * 서버에서 받은 실제 게시글(PostSummary)을 렌더링한다.
 * 카드 양옆 마진 16(카드 자체 px-4), 카드 사이 간격 16 — 쇼케이스와 동일.
 *
 * 초기 페이지는 Server Component가 조회해 seed로 넘기고, 하단 sentinel이 화면에 들어오면
 * useBoardFeed가 다음 페이지를 이어 붙인다(BFF GET /api/community/board). 마지막 페이지에
 * 도달하면 끝 표식(FeedListEnd)을 노출한다.
 */
export function CommunityFeedList({
  posts,
  page,
  isLast: initialIsLast,
}: {
  posts: PostSummary[];
  page: number;
  isLast: boolean;
}) {
  const { items, isLast, status, loadMore } = useBoardFeed({
    items: posts,
    page,
    isLast: initialIsLast,
  });

  // 에러 상태에선 자동 재요청을 멈추고, 사용자가 재시도 버튼으로만 다시 시도하게 한다.
  const sentinelRef = useInfiniteScroll({
    onReach: loadMore,
    enabled: !isLast && status !== "error",
    resetKey: items.length,
  });

  return (
    // 하단 91: 우하단 플로팅 FAB(작성 버튼)이 마지막 카드 UX를 가리지 않도록 여유를 둔 스펙값.
    <div className="flex flex-col gap-4 pt-6 pb-[91px]">
      {items.map((post) => (
        <FeedCardItem key={post.id} post={post} />
      ))}

      {!isLast && status !== "error" ? (
        <div ref={sentinelRef} aria-hidden className="h-px" />
      ) : null}

      {status === "loading" ? <FeedLoadingMore /> : null}
      {status === "error" ? <FeedLoadMoreError onRetry={loadMore} /> : null}
      {isLast ? <FeedListEnd /> : null}
    </div>
  );
}

/**
 * 단일 게시글 카드.
 *
 * 좋아요/저장은 서버 초기 상태(viewer)를 시드로 usePostActions가 낙관적 토글 + BFF 요청을 담당한다
 * (상세 화면과 동일 훅 재사용). 카드 탭/댓글 탭 → 상세 열기(네이티브면 서브뷰, 웹이면 라우터 이동).
 *
 * 저장(북마크) 카운트는 응답에 없어 0으로 둔다 → FeedCard가 숫자를 숨기고 아이콘만 표시한다.
 */
function FeedCardItem({ post }: { post: PostSummary }) {
  const openPostDetail = useOpenPostDetail();
  const { liked, bookmarked, likes, toggleLike, toggleBookmark } =
    usePostActions(post.id, {
      liked: post.viewer.liked,
      bookmarked: post.viewer.bookmarked,
      likes: post.counts.likes,
    });

  return (
    <FeedCard
      author={{
        name: post.author.nickname,
        avatarUrl: post.author.avatarUrl ?? undefined,
      }}
      createdAt={post.createdAt}
      title={post.title}
      body={post.body}
      images={post.images.map((image) => ({ url: image.imageUrl, alt: "" }))}
      counts={{ comments: post.counts.comments, likes, bookmarks: 0 }}
      commented={post.viewer.commented}
      liked={liked}
      bookmarked={bookmarked}
      onPress={() => openPostDetail(post.id)}
      onPressComment={() => openPostDetail(post.id)}
      onToggleLike={toggleLike}
      onToggleBookmark={toggleBookmark}
    />
  );
}

/** 다음 페이지 로딩 표시(끝 표식과 동일 높이·정렬). */
function FeedLoadingMore() {
  return (
    <div className="flex h-[69px] items-center justify-center px-4">
      <span
        className="size-5 animate-spin rounded-full border-2 border-feed-card-header-avatar-bg border-t-transparent"
        role="status"
        aria-label="게시글 불러오는 중"
      />
    </div>
  );
}

/** 다음 페이지 로드 실패 — 안내 + 재시도. */
function FeedLoadMoreError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex h-[69px] flex-col items-center justify-center gap-1 px-4">
      <p className="text-sm text-feed-card-body-text">
        게시글을 더 불러오지 못했어요
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="text-sm font-semibold text-feed-card-body-text underline"
      >
        다시 시도
      </button>
    </div>
  );
}
