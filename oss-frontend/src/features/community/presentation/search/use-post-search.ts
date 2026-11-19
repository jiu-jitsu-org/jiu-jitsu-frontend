"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  normalizeSearchKeyword,
  searchResultBucket,
} from "@/features/community/domain/post-search";
import type { PostList } from "@/features/community/domain/post-summary";
import { feedPageUrl } from "@/features/community/presentation/use-board-feed";
import { track } from "@/shared/lib/analytics";
import { bffFetch } from "@/shared/lib/http/bff-fetch";

/** 검색 화면 주소의 검색어 쿼리 이름 — `/community/search?q=`. */
export const SEARCH_QUERY_PARAM = "q";

/** 검색 목록 BFF 경로(쿼리스트링 포함). page/size는 feedPageUrl이 덧붙인다. */
export function searchListUrl(keyword: string): string {
  return `/api/community/board?boardListType=SEARCH&searchKeyword=${encodeURIComponent(keyword)}`;
}

export type PostSearchState =
  /** 아직 찾지 않음 — 최근 검색을 보인다. */
  | { status: "idle" }
  | { status: "loading"; keyword: string }
  | { status: "done"; keyword: string; list: PostList }
  | { status: "error"; keyword: string };

/**
 * 글 검색 상태 훅(#591).
 *
 * 검색어는 주소(`?q=`)에 둔다 — 웹에서 결과 글을 열었다 뒤로 오면 같은 결과로 다시 그려진다. 앱은 상세가
 * 새 서브뷰라 이 웹뷰가 그대로 남아 상태가 유지된다. 새로 찾을 때는 주소를 바꿔 끼우기만(replaceState) 하고
 * 화면 이동은 하지 않는다 — 앱 뒤로가기가 검색마다 한 칸씩 되돌아가지 않고 바로 홈으로 나가게.
 *
 * 첫 페이지:
 * - 주소에 검색어가 있으면 Server Component가 읽어 둔 첫 페이지(initialList)로 바로 그린다.
 * - 서버가 못 읽었거나(만료 토큰 · 오류) 서버가 본 검색어와 다르면 브라우저가 BFF로 읽는다 —
 *   bffFetch가 만료 토큰을 앱에서 갱신해 한 번 더 시도한다.
 * 다음 페이지는 결과 목록(CommunityFeedList)이 같은 BFF로 이어 붙인다.
 *
 * 분석 기록(GA `search`)은 사람이 찾았을 때만 남긴다(뒤로 와서 다시 그린 결과는 세지 않는다).
 * 검색어는 보내지 않고 결과 수 구간만 보낸다.
 */
export function usePostSearch({
  serverKeyword,
  initialList,
}: {
  serverKeyword: string;
  initialList: PostList | null;
}) {
  const searchParams = useSearchParams();
  const urlKeyword = normalizeSearchKeyword(
    searchParams.get(SEARCH_QUERY_PARAM) ?? "",
  );

  const [state, setState] = useState<PostSearchState>(() => {
    if (!urlKeyword) return { status: "idle" };
    if (initialList && urlKeyword === serverKeyword) {
      return { status: "done", keyword: urlKeyword, list: initialList };
    }
    return { status: "loading", keyword: urlKeyword };
  });
  // 늦게 온 응답을 버리는 기준 — 마지막 검색 순번.
  const seqRef = useRef(0);

  /** 읽은 첫 페이지를 결과로 바꾼다. 그사이 새 검색이 시작됐으면 버린다. */
  const settle = useCallback(
    (seq: number, keyword: string, list: PostList | null, report: boolean) => {
      if (seq !== seqRef.current) return;
      if (!list) {
        setState({ status: "error", keyword });
        return;
      }
      setState({ status: "done", keyword, list });
      if (report) {
        track("search", {
          result_bucket: searchResultBucket(list.totalElements),
        });
      }
    },
    [],
  );

  const run = useCallback(
    (keyword: string, report: boolean) => {
      const seq = ++seqRef.current;
      setState({ status: "loading", keyword });
      void fetchSearchFirstPage(keyword).then((list) =>
        settle(seq, keyword, list, report),
      );
    },
    [settle],
  );

  // 서버가 첫 페이지를 주지 못한 채 열렸으면 브라우저가 읽는다(마운트 한 번 — 상태는 이미 loading).
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (state.status !== "loading") return;
    const { keyword } = state;
    const seq = ++seqRef.current;
    void fetchSearchFirstPage(keyword).then((list) =>
      settle(seq, keyword, list, false),
    );
  }, [settle, state]);

  /** 사람이 찾았다 — 주소를 바꿔 끼우고 첫 페이지를 읽는다. 빈 검색어는 요청하지 않는다. */
  const search = useCallback(
    (raw: string): string | null => {
      const keyword = normalizeSearchKeyword(raw);
      if (!keyword) return null;
      const url = new URL(window.location.href);
      url.searchParams.set(SEARCH_QUERY_PARAM, keyword);
      window.history.replaceState(null, "", url);
      run(keyword, true);
      return keyword;
    },
    [run],
  );

  /** 실패한 검색을 다시 읽는다(기록은 남기지 않는다). */
  const retry = useCallback(() => {
    if (state.status === "error") run(state.keyword, false);
  }, [run, state]);

  return { state, search, retry };
}

/** 검색 첫 페이지를 읽는다. 실패하면 null. */
async function fetchSearchFirstPage(keyword: string): Promise<PostList | null> {
  try {
    const response = await bffFetch(feedPageUrl(searchListUrl(keyword), 0));
    if (!response.ok) return null;
    const body = (await response.json().catch(() => null)) as {
      data?: PostList;
    } | null;
    return body?.data ?? null;
  } catch {
    return null;
  }
}
