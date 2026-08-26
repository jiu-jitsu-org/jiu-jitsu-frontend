"use client";

import { useCallback, useState } from "react";

import { useOpenPostDetail } from "@/features/community/presentation/use-open-post-detail";
import { useBoardFeed } from "@/features/community/presentation/use-board-feed";
import { useInfiniteScroll } from "@/features/community/presentation/use-infinite-scroll";
import { useFeedRevalidate } from "@/features/community/presentation/use-feed-revalidate";
import { usePostActions } from "@/features/community/presentation/use-post-actions";
import type { PostSummary } from "@/features/community/domain/post-summary";
import { FeedCard } from "@/features/community/presentation/feed/feed-card";
import { FeedCardMenu } from "@/features/community/presentation/feed/feed-card-menu";
import { FeedListEnd } from "@/features/community/presentation/feed/feed-list-end";
import {
  HIDE_TOAST,
  POST_HIDDEN_ACTION,
  toggleHidePost,
} from "@/features/community/presentation/hide-post";
import { cn } from "@/shared/lib/cn";
import { type PendingToastAction, usePendingToast, useToast } from "@/shared/ui";

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
 *
 * 상세가 닫히면서 남긴 안내(신고 등)는 목록이 대신 띄운다 — 닫히는 웹뷰에 띄운 토스트는
 * 사용자가 볼 수 없기 때문. 계약: shared/ui/pending-toast
 *
 * 상세 · 작성에서 돌아오면 바뀌었을 수 있는 게시글만 서버에서 다시 읽어 반영한다(useFeedRevalidate).
 * 전체 새로고침은 하지 않는다 — 누적된 페이지와 스크롤이 날아가기 때문.
 *
 * 카드가 빠지고 들어오는 것은 접힘/펼침으로 보여준다. 즉시 사라지면 아래 글들이 순간이동해
 * 무엇이 없어졌는지 알 수 없다.
 */

/**
 * 카드 접힘/펼침 시간(ms). 아래 transition duration-200과 **같은 값이어야** 한다 —
 * 이 시간이 지난 뒤 실제로 목록에서 제거하기 때문이다.
 */
const COLLAPSE_MS = 200;
export function CommunityFeedList({
  posts,
  page,
  isLast: initialIsLast,
}: {
  posts: PostSummary[];
  page: number;
  isLast: boolean;
}) {
  const toast = useToast();
  const {
    items,
    isLast,
    status,
    loadMore,
    removePost,
    restorePost,
    restoreRemoved,
    replacePost,
    prependNew,
  } = useBoardFeed({
    items: posts,
    page,
    isLast: initialIsLast,
  });

  // 접힌 상태로 그릴 카드들. 걷어내는 중(제거 직전)과 되돌린 직후(펼치기 전)가 모두 여기 들어간다.
  const [collapsedIds, setCollapsedIds] = useState<ReadonlySet<number>>(
    () => new Set(),
  );

  const setCollapsed = useCallback((postId: number, collapsed: boolean) => {
    setCollapsedIds((prev) => {
      if (prev.has(postId) === collapsed) return prev;

      const next = new Set(prev);
      if (collapsed) next.add(postId);
      else next.delete(postId);
      return next;
    });
  }, []);

  /** 접은 뒤 목록에서 걷어낸다 — 삭제 · 신고 · 숨기기가 모두 이 경로를 탄다. */
  const collapseAndRemove = useCallback(
    (postId: number) => {
      setCollapsed(postId, true);
      setTimeout(() => {
        removePost(postId);
        setCollapsed(postId, false);
      }, COLLAPSE_MS);
    },
    [removePost, setCollapsed],
  );

  /** 접힌 상태로 끼워 넣은 뒤 다음 프레임에 펼친다(넣자마자 펼치면 전환이 생략된다). */
  const expandAfterInsert = useCallback(
    (postId: number) => {
      setCollapsed(postId, true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setCollapsed(postId, false));
      });
    },
    [setCollapsed],
  );

  /**
   * 상세가 남긴 토스트 액션을 해석한다 — 지금은 "숨겼음" 하나.
   *
   * 숨긴 글의 상세는 200 + 정상 데이터로 내려와 재조회로는 판별할 수 없다(실측). 그래서 상세가
   * 남긴 이 신호로 카드를 걷어낸다. 삭제 · 신고 · 차단은 404라 재조회가 알아서 처리한다(#73).
   *
   * 인라인 함수로 넘기면 매 렌더 새 참조가 되어 소비 리스너가 계속 재등록되므로 useCallback으로 고정한다
   * (useBoardFeed의 콜백은 이미 안정적이라 의존성에 그대로 둘 수 있다).
   */
  const handlePendingAction = useCallback(
    (action: PendingToastAction) => {
      if (action.type !== POST_HIDDEN_ACTION || action.postId === undefined) {
        return;
      }

      // 토스트와 동시에 접는다 — "숨겼습니다" 안내와 카드가 사라지는 시점이 어긋나면 안 된다.
      collapseAndRemove(action.postId);
    },
    [collapseAndRemove],
  );

  /** 토스트의 되돌리기 — 숨김 해제 후 원래 자리에 다시 펼친다. */
  const handleUndoHide = useCallback(
    (action: PendingToastAction) => {
      if (action.type !== POST_HIDDEN_ACTION || action.postId === undefined) {
        return;
      }

      const postId = action.postId;
      void (async () => {
        const restored = await toggleHidePost(postId);
        if (!restored) {
          toast.show(HIDE_TOAST.undoFailed);
          return;
        }

        if (restoreRemoved(postId)) expandAfterInsert(postId);
      })();
    },
    [expandAfterInsert, restoreRemoved, toast],
  );

  usePendingToast(handlePendingAction, handleUndoHide);

  useFeedRevalidate({ replacePost, removePost, prependNew });

  // 에러 상태에선 자동 재요청을 멈추고, 사용자가 재시도 버튼으로만 다시 시도하게 한다.
  const sentinelRef = useInfiniteScroll({
    onReach: loadMore,
    enabled: !isLast && status !== "error",
    resetKey: items.length,
  });

  return (
    // 하단 91: 우하단 플로팅 FAB(작성 버튼)이 마지막 카드 UX를 가리지 않도록 여유를 둔 스펙값.
    // 카드 사이 간격 16은 각 카드가 mb-4로 갖는다 — 접힐 때 간격도 함께 사라져야 하기 때문
    // (컨테이너 gap은 높이가 0이 돼도 그대로 남아 빈 자리가 생긴다).
    <div className="flex flex-col pt-6 pb-[91px]">
      {items.map((post, index) => (
        // grid-rows 0fr↔1fr + overflow-hidden — 카드 높이가 이미지 유무로 제각각이라
        // 고정 높이를 쓸 수 없다. 아래 여백(16)도 함께 접어야 빈 자리가 남지 않는다.
        <div
          key={post.id}
          className={cn(
            "grid transition-[grid-template-rows,opacity,margin-bottom] duration-200 ease-out",
            collapsedIds.has(post.id)
              ? "mb-0 grid-rows-[0fr] opacity-0"
              : "mb-4 grid-rows-[1fr] opacity-100",
          )}
        >
          <div className="overflow-hidden">
            <FeedCardItem
              post={post}
              onDeleted={() => collapseAndRemove(post.id)}
              // 되돌리기로 복원할 수 있도록 걷어낸 위치를 함께 넘긴다.
              onRestored={() => {
                restorePost(post, index);
                expandAfterInsert(post.id);
              }}
            />
          </div>
        </div>
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
 * 저장(북마크) 카운트는 낙관적으로 ±1 한 뒤, 토글 응답의 saveCount(서버 확정값)로 덮어쓴다.
 * 0이면 FeedCard가 숫자를 숨기고 아이콘만 표시한다.
 *
 * 헤더 우측 ⋮는 소유자 여부(viewer.isOwner)로 항목이 갈려 카드가 소유할 수 없으므로 menu 슬롯으로 넘긴다.
 */
function FeedCardItem({
  post,
  onDeleted,
  onRestored,
}: {
  post: PostSummary;
  onDeleted: () => void;
  onRestored: () => void;
}) {
  const openPostDetail = useOpenPostDetail();
  const { liked, bookmarked, likes, saves, toggleLike, toggleBookmark } =
    usePostActions(post.id, {
      liked: post.viewer.liked,
      bookmarked: post.viewer.bookmarked,
      likes: post.counts.likes,
      saves: post.counts.saves,
    });

  return (
    <FeedCard
      author={{
        name: post.author.nickname,
        avatarUrl: post.author.avatarUrl ?? undefined,
      }}
      createdAt={post.createdAt}
      dateLabel={post.timeAgo}
      title={post.title}
      body={post.body}
      images={post.images.map((image) => ({ url: image.imageUrl, alt: "" }))}
      counts={{
        comments: post.counts.comments,
        likes,
        bookmarks: saves,
      }}
      commented={post.viewer.commented}
      liked={liked}
      bookmarked={bookmarked}
      onPress={() => openPostDetail(post.id)}
      onPressComment={() => openPostDetail(post.id)}
      onToggleLike={toggleLike}
      onToggleBookmark={toggleBookmark}
      menu={
        <FeedCardMenu
          postId={post.id}
          isOwner={post.viewer.isOwner}
          onDeleted={onDeleted}
          onRestored={onRestored}
        />
      }
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
