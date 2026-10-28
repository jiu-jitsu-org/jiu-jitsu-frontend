"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type AnimationEvent,
} from "react";

import { useOnLogin } from "@/features/auth/presentation/auth-provider";
import { useOpenPostDetail } from "@/features/community/presentation/use-open-post-detail";
import {
  FEED_LIST_URL,
  useBoardFeed,
} from "@/features/community/presentation/use-board-feed";
import { useInfiniteScroll } from "@/features/community/presentation/use-infinite-scroll";
import { useOpenMyActivity } from "@/features/community/presentation/use-open-my-activity";
import { useLoginGuard } from "@/features/community/presentation/use-login-guard";
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
import {
  type PendingToastAction,
  usePendingToast,
  useToast,
} from "@/shared/ui";

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
 * 비로그인으로 보다가 로그인하면 불러온 카드의 viewer 상태(좋아요 · 저장 · 소유자)를 제자리에서
 * 다시 읽는다(#173). 로그인은 네이티브 모달에서 일어나고 목록은 보던 자리에 남기 때문.
 *
 * 카드가 빠지고 들어오는 것은 접힘/펼침으로 보여준다. 즉시 사라지면 아래 글들이 순간이동해
 * 무엇이 없어졌는지 알 수 없다.
 *
 * 내 커뮤니티 활동(쓴 글 · 저장)도 항목 모양이 같아 이 목록을 그대로 쓴다. 기본값은 모두 메인 피드
 * 동작이고, 다른 목록은 출처(listUrl)와 표시 옵션만 바꿔 넘긴다.
 */

/**
 * 카드 접힘/펼침 시간(ms). 아래 transition duration-200과 **같은 값이어야** 한다 —
 * 이 시간이 지난 뒤 실제로 목록에서 제거하기 때문이다.
 */
const COLLAPSE_MS = 200;

/**
 * 새로 붙은 카드가 차례로 떠오르는 간격(ms)과 상한. 한 묶음(첫 페이지 · 다음 페이지) 안에서
 * 순서마다 60ms씩 늦추되, 7번째부터는 6번째와 같이 늦춘다 — 한 페이지가 길어도 마지막 카드가
 * 한참 뒤에야 나타나지 않게.
 */
const ENTER_STAGGER_MS = 60;
const ENTER_STAGGER_CAP = 6;
/** 떠오르는 시간(ms) — motion.css의 feed-rise-in과 같은 값. */
const ENTER_MS = 280;

function enterDelay(indexInBatch: number): string {
  return `${Math.min(indexInBatch, ENTER_STAGGER_CAP) * ENTER_STAGGER_MS}ms`;
}

export function CommunityFeedList({
  posts,
  page,
  isLast: initialIsLast,
  listUrl = FEED_LIST_URL,
  hideAuthor = false,
  authorLink = true,
  className,
}: {
  posts: PostSummary[];
  page: number;
  isLast: boolean;
  /** 다음 페이지 · 복귀 재조회에 쓸 목록 BFF 경로. 기본은 메인 피드. */
  listUrl?: string;
  /** 카드 작성자 행을 감춘다(모든 카드가 내 글인 목록). */
  hideAuthor?: boolean;
  /**
   * 내 글 카드의 아바타·닉네임을 눌러 내 커뮤니티 활동을 열지. 그 화면 안에서는 자기 자신을
   * 다시 쌓지 않도록 끈다.
   */
  authorLink?: boolean;
  /** 목록 바깥 여백. 기본은 메인 피드 스펙(위 24 · 아래 FAB 여유 91). */
  className?: string;
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
    refreshLoaded,
  } = useBoardFeed(
    {
      items: posts,
      page,
      isLast: initialIsLast,
    },
    listUrl,
  );

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

  /**
   * 접은 뒤 목록에서 걷어낸다 — 카드가 빠지는 모든 경로가 여기로 모인다.
   *
   * 목록 ⋮(삭제 · 신고 · 숨기기)와 상세에서 숨긴 신호는 즉시, 상세에서 삭제 · 신고 · 차단한 글은
   * 복귀 후 재조회 404로 뒤늦게 도착한다(#73). 어느 쪽이든 사라지는 모습은 같아야 한다.
   */
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

  useOnLogin(() => void refreshLoaded());

  // 목록 컨테이너 — 작성 후 복귀 스크롤 기준 · 뒤에 붙은 카드 모션에 함께 쓴다.
  const listRef = useRef<HTMLDivElement>(null);

  // 404로 걷어내는 카드도 접었다 제거한다 — 삭제 · 신고 · 차단은 상세에서 벌어지고 목록은
  // 복귀 후 재조회로 알게 되는데, 여기서 곧장 지우면 목록 ⋮ 경로와 달리 카드가 툭 사라진다.
  useFeedRevalidate({
    replacePost,
    removePost: collapseAndRemove,
    prependNew,
    listUrl,
    listRef,
  });

  // 첫 페이지 카드는 차례로 떠오르며 나타난다. SSR로 그려진 카드라 클래스를 렌더에서 바로 건다 —
  // 하이드레이션 뒤에 걸면 이미 보이던 카드가 한 번 사라졌다 다시 떠오른다. 끝나면 목록에서 뺀다:
  // 남겨 두면 접힘(opacity 전환) 때 애니메이션이 다시 얽힌다.
  // feed-rise-in은 끝나면 transform·opacity를 남기지 않는다(backwards) — 남은 transform은 카드 안
  // fixed 요소(메뉴 바깥 판·확인 창·시트)를 카드 안에 가둔다.
  const [enteringIds, setEnteringIds] = useState<ReadonlyMap<number, number>>(
    () => new Map(posts.map((post, index) => [post.id, index])),
  );

  const handleEnterEnd = useCallback(
    (postId: number, event: AnimationEvent<HTMLDivElement>) => {
      // animationend는 버블링되므로 카드 안쪽 아이콘 모션이 끝난 것과 구분한다.
      if (event.target !== event.currentTarget) return;
      setEnteringIds((prev) => {
        if (!prev.has(postId)) return prev;
        const next = new Map(prev);
        next.delete(postId);
        return next;
      });
    },
    [],
  );

  // 하이드레이션 전에 끝난 카드는 animationend를 놓친다(리스너가 아직 없다). 가장 늦은 카드가
  // 끝났을 시각 뒤에 한꺼번에 비운다 — 클래스가 남아도 backwards라 화면은 같지만, 목록에서 빼야
  // 접힘이 애니메이션과 얽히지 않는다.
  useEffect(() => {
    const timer = window.setTimeout(
      () => setEnteringIds((prev) => (prev.size === 0 ? prev : new Map())),
      ENTER_STAGGER_CAP * ENTER_STAGGER_MS + ENTER_MS + 100,
    );
    return () => window.clearTimeout(timer);
  }, []);

  // 무한 스크롤로 뒤에 붙은 카드만 차례로 떠오르게 한다(comment-replies의 더보기와 같은 방식).
  // 이미 있던 카드는 다시 움직이지 않고, 위에 끼어든 새 글(prependNew) · 되돌린 카드는 펼침이 따로 있어 제외한다
  // — 직전 커밋의 마지막 카드보다 뒤에 처음 보는 id만 고른다.
  const renderedIdsRef = useRef<ReadonlySet<number> | null>(null);
  useLayoutEffect(() => {
    const previous = renderedIdsRef.current;
    renderedIdsRef.current = new Set(items.map((post) => post.id));
    // 첫 커밋은 위 enteringIds가 맡는다.
    if (!previous) return;

    let lastSeenIndex = -1;
    items.forEach((post, index) => {
      if (previous.has(post.id)) lastSeenIndex = index;
    });
    const appended = items
      .slice(lastSeenIndex + 1)
      .filter((post) => !previous.has(post.id));
    if (appended.length === 0) return;
    // motion-safe와 같은 조건 — 동작 줄이기를 켠 사용자에게는 바로 보여준다.
    if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches)
      return;

    const list = listRef.current;
    appended.forEach((post, index) => {
      const el = list?.querySelector<HTMLElement>(
        `[data-feed-item="${post.id}"]`,
      );
      if (!el) return;
      // 첫 페이지와 같은 feed-rise-in — 끝난 뒤 남는 transform이 없다.
      el.style.animation = "var(--animate-feed-rise-in)";
      el.style.animationDelay = enterDelay(index);
      const clear = (event: Event) => {
        if (event.target !== el) return;
        el.style.animation = "";
        el.style.animationDelay = "";
        el.removeEventListener("animationend", clear);
      };
      el.addEventListener("animationend", clear);
    });
  }, [items]);

  // 에러 상태에선 자동 재요청을 멈추고, 사용자가 재시도 버튼으로만 다시 시도하게 한다.
  const sentinelRef = useInfiniteScroll({
    onReach: loadMore,
    enabled: !isLast && status !== "error",
    resetKey: items.length,
  });

  return (
    // 하단 91: 우하단 플로팅 FAB(작성 버튼)이 마지막 카드 UX를 가리지 않도록 여유를 둔 스펙값.
    // 글 사이 40 = 카드 위아래 눌림 여백 12 + 12 + 각 카드의 mb-4(16). mb는 접힐 때 간격도 함께
    // 사라져야 해서 카드가 갖는다(컨테이너 gap은 높이가 0이 돼도 그대로 남아 빈 자리가 생긴다).
    // 위 pt-3(12)도 카드 위 여백 12와 합쳐 첫 글까지 24를 유지한다.
    <div
      ref={listRef}
      className={cn("flex flex-col pt-3 pb-[91px]", className)}
    >
      {items.map((post, index) => {
        const enterIndex = enteringIds.get(post.id);

        return (
          // grid-rows 0fr↔1fr + overflow-hidden — 카드 높이가 이미지 유무로 제각각이라
          // 고정 높이를 쓸 수 없다. 아래 여백(16)도 함께 접어야 빈 자리가 남지 않는다.
          // 떠오르는 모션은 overflow-hidden 바깥(이 칸)에 건다 — 안쪽에 걸면 아래 8px이 잘린다.
          <div
            key={post.id}
            data-feed-item={post.id}
            onAnimationEnd={
              enterIndex === undefined
                ? undefined
                : (event) => handleEnterEnd(post.id, event)
            }
            style={
              enterIndex === undefined
                ? undefined
                : { animationDelay: enterDelay(enterIndex) }
            }
            className={cn(
              "grid transition-[grid-template-rows,opacity,margin-bottom] duration-200 ease-out",
              collapsedIds.has(post.id)
                ? "mb-0 grid-rows-[0fr] opacity-0"
                : "mb-4 grid-rows-[1fr] opacity-100",
              enterIndex !== undefined && "motion-safe:animate-feed-rise-in",
            )}
          >
            <div className="overflow-hidden">
              <FeedCardItem
                post={post}
                hideAuthor={hideAuthor}
                authorLink={authorLink}
                onDeleted={() => collapseAndRemove(post.id)}
                // 되돌리기로 복원할 수 있도록 걷어낸 위치를 함께 넘긴다.
                onRestored={() => {
                  restorePost(post, index);
                  expandAfterInsert(post.id);
                }}
              />
            </div>
          </div>
        );
      })}

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
 *
 * 비로그인(#173): 좋아요·저장은 토글 전에 로그인 알럿으로 막고(상태는 비활성 그대로), ⋮는 감춘다 —
 * 신고 · 숨기기 · 수정 · 삭제 모두 계정이 있어야 성립해 비로그인에게 열어줄 항목이 없다.
 *
 * 내 글이면 아바타·닉네임 탭으로 내 커뮤니티 활동을 연다. 남의 이름은 프로필 API가 없어 아직 누를 수 없다.
 */
function FeedCardItem({
  post,
  hideAuthor,
  authorLink,
  onDeleted,
  onRestored,
}: {
  post: PostSummary;
  hideAuthor: boolean;
  authorLink: boolean;
  onDeleted: () => void;
  onRestored: () => void;
}) {
  const openPostDetail = useOpenPostDetail();
  const openMyActivity = useOpenMyActivity();
  const { liked, bookmarked, likes, saves, toggleLike, toggleBookmark } =
    usePostActions(post.id, {
      liked: post.viewer.liked,
      bookmarked: post.viewer.bookmarked,
      likes: post.counts.likes,
      saves: post.counts.saves,
    });
  const { guest, guard } = useLoginGuard();

  return (
    <FeedCard
      author={{
        name: post.author.nickname,
        avatarUrl: post.author.avatarUrl ?? undefined,
        belt: post.author.belt,
      }}
      createdAt={post.createdAt}
      categoryName={post.categoryName}
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
      hideAuthor={hideAuthor}
      onPressAuthor={
        authorLink && post.viewer.isOwner ? openMyActivity : undefined
      }
      onPress={() => openPostDetail(post.id)}
      onPressComment={() => openPostDetail(post.id)}
      onToggleLike={guard(
        toggleLike,
        "좋아요는 OSS 앱에서 로그인 후 누를 수 있어요.",
      )}
      onToggleBookmark={guard(
        toggleBookmark,
        "북마크는 OSS 앱에서 로그인 후 저장할 수 있어요.",
      )}
      menu={
        guest ? undefined : (
          <FeedCardMenu
            postId={post.id}
            isOwner={post.viewer.isOwner}
            onDeleted={onDeleted}
            onRestored={onRestored}
          />
        )
      }
    />
  );
}

/**
 * 다음 페이지 로딩 표시(끝 표식과 동일 높이·정렬). 스크롤 끝에서 툭 끼어들지 않게 옅게 나타난다.
 * 내 커뮤니티 활동 '밸런스 게임' 목록도 같은 모양을 쓴다(label만 다르다).
 */
export function FeedLoadingMore({
  label = "게시글 불러오는 중",
}: {
  label?: string;
}) {
  return (
    <div className="flex h-[69px] items-center justify-center px-4 motion-safe:animate-fade-in">
      <span
        className="size-5 animate-spin rounded-full border-2 border-feed-card-header-avatar-bg border-t-transparent"
        role="status"
        aria-label={label}
      />
    </div>
  );
}

/** 다음 페이지 로드 실패 — 안내 + 재시도. 로딩 표시와 같이 옅게 나타난다. */
export function FeedLoadMoreError({
  onRetry,
  message = "게시글을 더 불러오지 못했어요",
}: {
  onRetry: () => void;
  message?: string;
}) {
  return (
    <div className="flex h-[69px] flex-col items-center justify-center gap-1 px-4 motion-safe:animate-fade-in">
      <p className="text-body-s text-feed-card-body-text">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        // 글자 버튼이라 평소엔 면이 없고, 누르는 동안만 앱바 아이콘과 같은 옅은 면이 깔린다.
        // 면 여백(px-2·py-0.5)은 음수 마진으로 상쇄해 줄 높이·문구 위치를 그대로 둔다.
        className="-mx-2 -my-0.5 rounded-[6px] px-2 py-0.5 text-sm font-semibold text-feed-card-body-text underline motion-safe:transition-colors motion-safe:duration-120 active:bg-surface-container-pressed"
      >
        다시 시도
      </button>
    </div>
  );
}
