"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import type { BoardListPageDataResult } from "@/features/community/application/get-board-list-page-data";
import type { FeedCompetition } from "@/features/community/application/get-home-feed-page-data";
import { SessionExpiredRecovery } from "@/features/auth/presentation/session-expired-recovery";
import {
  boardListQueryOf,
  feedFilterKey,
  feedFilterSearch,
  parseFeedFilter,
  type FeedFilter,
} from "@/features/community/domain/feed-filter";
import type { PostCategory } from "@/features/community/domain/post";
import { CommunityFeedList } from "@/features/community/presentation/community-feed-list";
import { FeedEmptyState } from "@/features/community/presentation/feed-empty-state";
import { FeedErrorState } from "@/features/community/presentation/feed-error-state";
import { FeedCardsSkeleton } from "@/features/community/presentation/feed/feed-cards-skeleton";
import { PostWriteFab } from "@/features/community/presentation/post-write-fab";
import { revealInRow } from "@/features/community/presentation/reveal-in-row";
import {
  clearRevalidated,
  peekRevalidateTarget,
} from "@/features/community/presentation/dirty-posts";
import { fetchFeedPage } from "@/features/community/presentation/use-board-feed";
import { useOpenPostWrite } from "@/features/community/presentation/use-open-post-write";
import { WeeklyTopic } from "@/features/community/presentation/weekly-topic";
import { useOpenCompetitionDetail } from "@/features/competition/presentation/competition-detail-link";
import { track } from "@/shared/lib/analytics";
import {
  InboundMessageType,
  OutboundMessageType,
  registerWebBridge,
  setNativeHomeCategoryTabs,
  supportsNativeMessage,
} from "@/shared/lib/native-bridge";
import { Button } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";
import { EmptyState } from "@/shared/ui/empty-state";
import { IconButton } from "@/shared/ui/icon-button";
import { ChevronLeftIcon, CloseIcon } from "@/shared/ui/icons";
import { Spinner } from "@/shared/ui/spinner";

/** 목록 영역 — 서버가 그린 첫 목록(null)이거나, 탭을 바꿔 클라이언트가 읽은 목록. */
type FeedContent = {
  /** 목록을 새로 그릴 열쇠 — 같은 탭을 다시 읽어도 바뀐다. */
  key: string;
  result: BoardListPageDataResult | "loading";
} | null;

/**
 * 홈 피드 — 위 카테고리 탭 + (전체면 오늘의 밸런스 게임 · 카테고리면 설명과 이번 주 써 볼 주제) + 목록(#590 · #598).
 *
 * 첫 화면은 서버가 주소(`/?categoryId=` · `/?competitionId=`)대로 그려 넘기고, 탭을 바꾸면 여기서 첫 페이지를
 * BFF로 읽어 목록만 갈아 끼운다 — 라우트를 다시 렌더하면 탭 줄까지 로딩 화면으로 덮여 깜빡인다.
 * 바꾼 탭은 주소에도 남긴다(history.replaceState — 뒤로 가기 기록은 쌓지 않는다). 새로고침 · 웹에서 상세를 보고
 * 돌아와도 같은 탭으로 열린다. 앱은 상세가 서브뷰로 덮였다 닫힐 뿐 이 웹뷰가 그대로라 탭 · 위치가 그대로다.
 *
 * 탭 줄은 붙박이(sticky)가 아니다 — 위로 지나가면 오늘의 밸런스 게임 접힌 바가 같은 자리(맨 위)에 뜬다.
 */
export function HomeFeed({
  categories,
  initialFilter,
  initialCompetition,
  initialResult,
  balance,
}: {
  categories: PostCategory[];
  initialFilter: FeedFilter;
  initialCompetition: FeedCompetition | null;
  initialResult: BoardListPageDataResult;
  /** 오늘의 밸런스 게임(서버가 그린 판). 전체 탭에서만 보인다. */
  balance: ReactNode;
}) {
  const [filter, setFilter] = useState(initialFilter);
  const [competition, setCompetition] = useState(initialCompetition);
  const [content, setContent] = useState<FeedContent>(null);
  const requestSeq = useRef(0);
  const topRef = useRef<HTMLDivElement>(null);

  const selectedCategory =
    filter.categoryId === null
      ? undefined
      : categories.find((category) => category.id === filter.categoryId);

  /** 첫 페이지를 읽어 목록을 갈아 끼운다. 늦게 온 옛 응답은 버린다. */
  const load = useCallback(async (next: FeedFilter) => {
    const seq = ++requestSeq.current;
    const key = `${feedFilterKey(next)}#${seq}`;
    setContent({ key, result: "loading" });
    const list = await fetchFeedPage(feedListUrlOf(next), 0);
    if (seq !== requestSeq.current) return;
    setContent({
      key,
      result: list
        ? { ok: true, data: { list } }
        : { ok: false, reason: "error", status: 0, code: "", error: "" },
    });
  }, []);

  // 같은 JS 턴에 고르기가 연달아 와도(앱 칩 빠른 두 번) 방금 고른 값과 비교하도록, 렌더를 기다리지 않는 최신값.
  const filterRef = useRef(filter);

  const select = useCallback(
    (next: FeedFilter, options: { syncUrl?: boolean } = {}) => {
      filterRef.current = next;
      setFilter(next);
      if (next.competitionId === null) setCompetition(null);
      if (options.syncUrl !== false) {
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${feedFilterSearch(next)}`,
        );
      }
      // 탭 줄이 위로 조금 지나간 채 탭을 바꾸면 새 목록의 맨 위(탭 줄)로 올린다.
      const top = topRef.current?.getBoundingClientRect().top ?? 0;
      if (top < 0) window.scrollTo({ top: window.scrollY + top });
      void load(next);
    },
    [load],
  );

  // 글 카드의 카테고리 이름은 누르지 않는다 — 바로 위 탭 줄이 같은 일을 하고, 목록이 통째로 바뀌어 당황스러웠다.
  // 카테고리 모아 보기는 글 상세의 카테고리 이름이 맡는다(PostCategoryLink).
  function selectCategory(categoryId: number | null) {
    // 이 대회 글만 보는 중에 같은 '대회' 탭을 누르면 그대로 둔다 — 조건은 ✕로만 넓힌다.
    // 앱 칩을 빠르게 두 번 누르면 렌더 전에 둘째가 오므로, 방금 고른 값(filterRef)과 비교한다.
    if (categoryId === filterRef.current.categoryId) return;
    track("category_select", { category: categoryId ?? "all", from: "tab" });
    select({ categoryId, competitionId: null });
  }

  // 웹에서 뒤로 가기로 돌아오면 Next가 처음 그린 화면(바꾸기 전 탭)을 되살릴 수 있다 — 주소의 탭과 다르면 맞춘다.
  // 대회 조건은 대회 이름이 있어야 그려서 서버가 연 화면만 믿는다.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("competitionId")) return;
    const fromUrl = parseFeedFilter(
      { categoryId: params.get("categoryId") },
      categories,
    );
    if (feedFilterKey(fromUrl) !== feedFilterKey(initialFilter)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 하이드레이션 뒤에야 브라우저 주소를 읽을 수 있다.
      select(fromUrl, { syncUrl: false });
    }
    // 처음 한 번만 — 그 뒤로는 탭이 주소를 이끈다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 이 대회 글만 보며 들어왔으면 한 번 남긴다(GA, #598).
  useEffect(() => {
    if (!initialCompetition) return;
    track("feed_competition_filter", {
      competition_id: initialCompetition.id,
      action: "apply",
      from: new URLSearchParams(window.location.search).get("from"),
    });
  }, [initialCompetition]);

  const listUrl = feedListUrlOf(filter);
  const result = content?.result ?? initialResult;
  const contentKey = content?.key ?? feedFilterKey(initialFilter);
  const showsEmpty =
    result !== "loading" && result.ok && result.data.list.items.length === 0;

  // 빈 화면에는 목록이 없어 작성 후 복귀 감지(useFeedRevalidate)가 돌지 않는다 — 첫 글을 쓰고 돌아오면 다시 읽는다.
  useEffect(() => {
    if (!showsEmpty) return;
    function reloadAfterWrite() {
      if (document.visibilityState !== "visible") return;
      const target = peekRevalidateTarget();
      if (target.createdPostId === null) return;
      clearRevalidated(target);
      void load(filter);
    }
    window.addEventListener("pageshow", reloadAfterWrite);
    document.addEventListener("visibilitychange", reloadAfterWrite);
    return () => {
      window.removeEventListener("pageshow", reloadAfterWrite);
      document.removeEventListener("visibilitychange", reloadAfterWrite);
    };
  }, [showsEmpty, filter, load]);
  const isAll = filter.categoryId === null;

  // 앱 머리줄이 칩을 그리면(HOME_CATEGORY_TABS) 칩 목록 · 고른 칩을 알리고, 앱 칩을 누르면 같은 길(탭)로 고른다.
  const nativeTabs = useSyncExternalStore(
    subscribeNoop,
    supportsNativeHomeTabs,
    () => false,
  );
  const selectCategoryRef = useRef(selectCategory);
  useEffect(() => {
    selectCategoryRef.current = selectCategory;
  });
  useEffect(() => {
    if (!nativeTabs) return;
    setNativeHomeCategoryTabs({
      tabs: categoryTabsOf(categories),
      selectedId: filter.categoryId,
    });
  }, [nativeTabs, categories, filter.categoryId]);
  useEffect(() => {
    if (!nativeTabs) return;
    return registerWebBridge((message) => {
      if (message.type !== InboundMessageType.HOME_CATEGORY_SELECT) return;
      const id = message.payload?.categoryId;
      // 전체(null)이거나 목록에 있는 카테고리만 고른다. 모르는 값은 무시한다.
      if (id === null || categories.some((category) => category.id === id)) {
        selectCategoryRef.current(id ?? null);
      }
      // 바뀌었든 안 바뀌었든 지금 고른 칩을 다시 알린다 — 앱은 이 답을 받아야 먼저 바꿔 둔 칩을 확정한다.
      setNativeHomeCategoryTabs({
        tabs: categoryTabsOf(categories),
        selectedId: filterRef.current.categoryId,
      });
    });
  }, [nativeTabs, categories]);

  return (
    <>
      <div ref={topRef}>
        {/* 앱 머리줄이 칩을 그리면 웹 칩 줄은 숨긴다. 그리기 전에는 문서 시작 표시(globals.css)가, 뜬 뒤에는
            nativeTabs가 숨긴다 — React가 화면을 처음부터 다시 그리면 <html>에 단 표시가 지워질 수 있어 둘 다 둔다. */}
        {nativeTabs ? null : (
          <CategoryTabs
            categories={categories}
            selectedId={filter.categoryId}
            onSelect={selectCategory}
          />
        )}
        {isAll ? null : (
          <div
            className={nativeTabs ? "h-3" : "home-category-tabs-gap h-3"}
          />
        )}
      </div>

      {isAll ? balance : null}
      {competition ? (
        <CompetitionFilterBar
          competition={competition}
          onClear={() => {
            track("feed_competition_filter", {
              competition_id: competition.id,
              action: "clear",
            });
            select({ categoryId: filter.categoryId, competitionId: null });
          }}
        />
      ) : selectedCategory ? (
        <CategoryIntro category={selectedCategory} />
      ) : null}

      {result === "loading" ? (
        <FeedCardsSkeleton className="pt-3" />
      ) : (
        <FeedListContent
          key={contentKey}
          result={result}
          filter={filter}
          listUrl={listUrl}
          onRetry={() => void load(filter)}
          clientLoaded={content !== null}
        />
      )}

      {/* 게시글 작성 진입 FAB — 고른 카테고리(또는 이 대회)를 미리 골라 연다(#588). */}
      <PostWriteFab
        categoryId={filter.categoryId ?? undefined}
        competitionId={competition?.id}
      />
    </>
  );
}

const subscribeNoop = () => () => {};
const supportsNativeHomeTabs = () =>
  supportsNativeMessage(OutboundMessageType.HOME_CATEGORY_TABS);

/** 칩 목록 — 맨 앞 '전체'(id null) + 서버 순서 카테고리. 웹 칩 줄과 앱 머리줄 칩이 같은 목록을 쓴다. */
function categoryTabsOf(
  categories: PostCategory[],
): { id: number | null; name: string }[] {
  return [
    { id: null, name: "전체" },
    ...categories.map((category) => ({ id: category.id, name: category.name })),
  ];
}

/**
 * 카테고리 탭 줄 — 전체 + 서버 순서 카테고리. 넘치면 가로로 밀린다(글쓰기 카테고리 칩 줄과 같은 칩 · 간격).
 * 고른 탭은 밀려 있어도 보이게 줄을 민다. 큰 글씨에서도 잘리지 않게 칩 높이는 글자만큼 자란다.
 */
function CategoryTabs({
  categories,
  selectedId,
  onSelect,
}: {
  categories: PostCategory[];
  selectedId: number | null;
  onSelect: (categoryId: number | null) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const revealed = useRef(false);

  useEffect(() => {
    const row = rowRef.current;
    const chip = row?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!row || !chip) return;
    // 처음은 바로, 그 뒤 고를 때는 부드럽게.
    revealInRow(row, chip, revealed.current ? "smooth" : "auto");
    revealed.current = true;
  }, [selectedId]);

  const tabs = categoryTabsOf(categories);

  return (
    <div
      ref={rowRef}
      className="home-category-tabs overflow-x-auto px-4 pt-3 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div role="tablist" aria-label="카테고리" className="flex w-max gap-2">
        {tabs.map((tab) => {
          const selected = tab.id === selectedId;
          return (
            <Chip
              key={tab.id ?? "all"}
              role="tab"
              aria-selected={selected}
              selected={selected}
              tone="primary"
              onClick={() => onSelect(tab.id)}
              className="h-auto min-h-8 py-1 whitespace-nowrap"
            >
              {tab.name}
            </Chip>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 카테고리 탭 아래 — 이번 주 써 볼 주제와 '이 주제로 쓰기'. 주제가 없으면 자리도 없다.
 * 카테고리 설명 한 줄은 두지 않는다 — 탭 이름('도장 · 오픈매트' 등)이 이미 무엇을 쓰는 곳인지 말해 준다.
 */
function CategoryIntro({ category }: { category: PostCategory }) {
  const topic = category.weeklyTopic;
  const openTopicWrite = useOpenPostWrite({
    categoryId: category.id,
    topic: topic ?? undefined,
    from: "topic_suggestion",
  });

  useEffect(() => {
    if (!topic) return;
    track("banner_view", { banner: "topic", category: category.id });
  }, [category.id, topic]);

  if (!topic) return null;

  return (
    <div className="px-4">
      <WeeklyTopic
        topic={topic}
        action={
          <Button
            variant="tint"
            size="s"
            onClick={() => {
              track("banner_click", {
                banner: "topic",
                category: category.id,
              });
              openTopicWrite();
            }}
          >
            이 주제로 쓰기
          </Button>
        }
      />
    </div>
  );
}

/**
 * 이 대회 글만 보는 중(#598) — '대회' 탭 아래 옅은 파란 줄. '대회 보기'는 그 대회 상세, ✕는 '대회' 탭 전체 글로 넓힌다.
 */
function CompetitionFilterBar({
  competition,
  onClear,
}: {
  competition: FeedCompetition;
  onClear: () => void;
}) {
  const openCompetition = useOpenCompetitionDetail("home_feed");

  return (
    <section
      aria-label="이 대회 글만 보는 중"
      className="mx-4 flex items-center gap-1 rounded-20 bg-surface-primary-subtle py-1 pr-1 pl-4"
    >
      {/* 긴 대회 이름만 말줄임 — "글만 보는 중"은 늘 보이게 따로 둔다. */}
      <p className="flex min-w-0 flex-1 text-body-s text-text-primary">
        <span className="truncate font-semibold">{competition.name}</span>
        <span className="shrink-0 whitespace-pre"> 글만 보는 중</span>
      </p>
      <Button
        variant="text"
        size="s"
        onClick={() => {
          track("feed_competition_filter", {
            competition_id: competition.id,
            action: "open_competition",
          });
          openCompetition(competition.id);
        }}
        className="gap-0.5 px-2"
      >
        대회 보기
        <ChevronLeftIcon size={16} className="rotate-180" />
      </Button>
      <IconButton
        size="s"
        aria-label="이 대회 글만 보기 해제"
        onClick={onClear}
        className="text-icon-secondary"
      >
        <CloseIcon size={18} />
      </IconButton>
    </section>
  );
}

/** 목록 · 빈 화면 · 실패 화면. */
function FeedListContent({
  result,
  filter,
  listUrl,
  clientLoaded,
  onRetry,
}: {
  result: BoardListPageDataResult;
  filter: FeedFilter;
  listUrl: string;
  /** 탭을 바꿔 클라이언트가 읽은 목록인지 — 실패 다시 시도를 라우트가 아니라 이 목록으로. */
  clientLoaded: boolean;
  onRetry: () => void;
}) {
  if (!result.ok) {
    if (result.reason === "session-expired") {
      return (
        <SessionExpiredRecovery
          loading={
            <div className="flex min-h-[60vh] items-center justify-center">
              <Spinner />
            </div>
          }
        />
      );
    }
    return <FeedErrorState onRetry={clientLoaded ? onRetry : undefined} />;
  }

  if (result.data.list.items.length === 0) {
    return <FilteredEmptyState filter={filter} />;
  }

  return (
    <CommunityFeedList
      posts={result.data.list.items}
      page={result.data.list.page}
      isLast={result.data.list.isLast}
      listUrl={listUrl}
    />
  );
}

/** 빈 목록. 전체는 지금 그대로, 카테고리 · 이 대회는 그 자리에 첫 글을 쓰게 한다. */
function FilteredEmptyState({ filter }: { filter: FeedFilter }) {
  const openWrite = useOpenPostWrite(
    filter.competitionId !== null
      ? { competitionId: filter.competitionId, from: "feed_button" }
      : { categoryId: filter.categoryId ?? undefined, from: "feed_button" },
  );
  if (filter.categoryId === null) return <FeedEmptyState />;

  return (
    // 위 설명 · 써 볼 주제 아래에 이어 붙는다 — 화면 가운데가 아니라 위에서 조금 띄운다.
    <EmptyState
      title={
        filter.competitionId !== null
          ? "아직 이 대회 글이 없어요"
          : "아직 이 카테고리에 글이 없어요"
      }
      description="첫 글을 남겨 보세요"
      action={{ label: "글쓰기", onClick: openWrite }}
      className="pt-20 pb-[91px]"
    />
  );
}

/** 이 목록의 BFF 경로(page · size는 useBoardFeed가 붙인다). 전체면 지금 피드 경로와 같다. */
function feedListUrlOf(filter: FeedFilter): string {
  const query = boardListQueryOf(filter);
  const params = new URLSearchParams({ boardListType: query.boardListType });
  if (query.categoryId !== undefined) {
    params.set("categoryId", String(query.categoryId));
  }
  if (query.competitionId !== undefined) {
    params.set("competitionId", String(query.competitionId));
  }
  return `/api/community/board?${params.toString()}`;
}
