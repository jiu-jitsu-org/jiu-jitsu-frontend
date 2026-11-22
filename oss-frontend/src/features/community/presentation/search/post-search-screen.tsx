"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { splitSearchWords } from "@/features/community/domain/post-search";
import type { PostList } from "@/features/community/domain/post-summary";
import { CommunityFeedList } from "@/features/community/presentation/community-feed-list";
import { FeedErrorState } from "@/features/community/presentation/feed-error-state";
import { scrollContainerOf } from "@/features/community/presentation/scroll-container";
import { PostSearchAppBar } from "@/features/community/presentation/search/post-search-app-bar";
import { PostSearchEmpty } from "@/features/community/presentation/search/post-search-empty";
import { PostSearchRecent } from "@/features/community/presentation/search/post-search-recent";
import { PostSearchResultsSkeleton } from "@/features/community/presentation/search/post-search-skeleton";
import {
  type PostSearchFrom,
  searchListUrl,
  usePostSearch,
} from "@/features/community/presentation/search/use-post-search";
import { useRecentSearches } from "@/features/community/presentation/search/use-recent-searches";
import { SubviewScrollShell } from "@/features/community/presentation/subview-scroll-shell";

/**
 * 커뮤니티 글 검색 화면 (#591).
 *
 * - 처음: 최근 검색(이 기기, 10개). 없으면 검색칸만. 검색칸을 비우면 다시 최근 검색이 보인다.
 * - 결과: 결과 수 + 피드와 같은 글 카드(CommunityFeedList) — 제목 · 본문에서 찾은 말을 표시한다.
 *   다음 페이지 · 불러오는 중 · 실패 · 끝 표시, 카드 ⋮ · 좋아요 · 저장 · 상세 다녀온 뒤 반영도 피드와 같다.
 * - 0건: "'○○' 글이 아직 없어요" + '이 주제로 글쓰기'.
 *
 * 앱에서 서브뷰로 열려 문서 스크롤이 막히므로 SubviewScrollShell이 스크롤한다(#200).
 */
export function PostSearchScreen({
  serverKeyword,
  initialList,
}: {
  /** Server Component가 주소에서 읽은 검색어(다듬은 값). 없으면 "". */
  serverKeyword: string;
  /** 서버가 읽어 둔 첫 페이지. 못 읽었으면 null — 브라우저가 다시 읽는다. */
  initialList: PostList | null;
}) {
  const { state, search, retry } = usePostSearch({
    serverKeyword,
    initialList,
  });
  const { recent, add, remove, clear } = useRecentSearches();
  const [input, setInput] = useState(
    state.status === "idle" ? "" : state.keyword,
  );
  const bodyRef = useRef<HTMLDivElement>(null);

  const submit = useCallback(
    (raw: string, from: PostSearchFrom) => {
      const keyword = search(raw, from);
      if (!keyword) return;
      setInput(keyword);
      add(keyword);
      // 새 결과는 맨 위부터 — 앞 결과를 내려 보던 자리에 머물지 않게.
      const body = bodyRef.current;
      const scroller = body ? scrollContainerOf(body) : null;
      scroller?.scrollTo({ top: 0 });
    },
    [add, search],
  );

  const keyword = state.status === "idle" ? "" : state.keyword;
  const words = useMemo(() => splitSearchWords(keyword), [keyword]);
  const showRecent = state.status === "idle" || input.trim() === "";

  return (
    // 목록 카드(surface-container)가 메인 피드와 같아 보이도록 바탕도 피드와 같은 색을 쓴다.
    <SubviewScrollShell className="bg-surface-container">
      <PostSearchAppBar
        value={input}
        onValueChange={setInput}
        onSubmit={(raw) => submit(raw, "community_search")}
        autoFocus={state.status === "idle"}
      />
      <div ref={bodyRef}>
        {showRecent ? (
          <PostSearchRecent
            recent={recent}
            onSelect={(recentKeyword) => submit(recentKeyword, "recent_search")}
            onRemove={remove}
            onClear={clear}
          />
        ) : state.status === "loading" ? (
          <PostSearchResultsSkeleton />
        ) : state.status === "error" ? (
          // 앱바가 있어 뷰포트 전체 높이를 쓰면 그만큼 스크롤이 생긴다 → 60vh로 줄인다(내 커뮤니티 활동과 같다).
          <FeedErrorState className="min-h-[60vh]" onRetry={retry} />
        ) : state.status === "done" && state.list.items.length === 0 ? (
          <PostSearchEmpty keyword={state.keyword} />
        ) : state.status === "done" ? (
          <>
            {/* 결과 수: Body S 회색, 위 12 · 좌우 16. 카드 묶음 위에 한 줄로만 둔다. */}
            <p className="px-4 pt-3 text-body-s text-text-secondary">
              검색 결과 {state.list.totalElements.toLocaleString("ko-KR")}개
            </p>
            {/* key=검색어: 새로 찾으면 목록을 새로 마운트한다 — 앞 검색의 누적 페이지를 들고 가지 않게. */}
            <CommunityFeedList
              key={state.keyword}
              posts={state.list.items}
              page={state.list.page}
              isLast={state.list.isLast}
              listUrl={searchListUrl(state.keyword)}
              highlightWords={words}
              showListEnd={false}
              className="pt-1 pb-[var(--safe-area-bottom)]"
            />
          </>
        ) : null}
      </div>
    </SubviewScrollShell>
  );
}
