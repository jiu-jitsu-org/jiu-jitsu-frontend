"use client";

import { useCallback, useRef, useState } from "react";

import {
  FEED_PAGE_SIZE,
  type PostList,
  type PostSummary,
} from "@/features/community/domain/post-summary";
import { bffFetch } from "@/shared/lib/http/bff-fetch";

/**
 * 메인 피드 무한 스크롤 상태 훅.
 *
 * Server Component가 조회한 첫 페이지(items/page/isLast)를 시드로 받아, 이후 페이지는
 * BFF(GET /api/community/board)로 이어 붙인다(Browser → app/api → application → infrastructure).
 * 다음 페이지 로드는 loadMore로 트리거하며, 뷰포트 감지는 useInfiniteScroll이 담당한다.
 *
 * - 동시/중복 로드는 진행 플래그(loadingRef)로 막는다.
 * - 페이지 사이에 새 글이 끼어들면 page 기준 오프셋이 겹칠 수 있어 id로 중복 제거한다(키 충돌 방지).
 * - 카드를 걷어 내면(숨기기 · 신고 · 삭제 · 차단) 서버 목록도 그만큼 당겨져, 다음 페이지가 경계의 글을 건너뛴다.
 *   걷어 낸 뒤 첫 loadMore는 당겨진 만큼 앞 페이지까지 다시 받아 메운다(#522).
 * - 실패하면 status="error"로 두고 loadMore 재호출(재시도)로 같은 페이지를 다시 시도한다.
 *
 * listUrl은 목록 출처(BFF 경로)다. 기본은 메인 피드이고, 내 커뮤니티 활동(쓴 글 · 저장)처럼
 * 항목 모양이 같은 다른 목록은 경로만 바꿔 같은 훅을 쓴다. 문자열이라 참조가 안정적이다.
 */
type FeedStatus = "idle" | "loading" | "error";

/** 메인 피드 목록 BFF 경로(쿼리스트링 포함). page/size는 feedPageUrl이 덧붙인다. */
export const FEED_LIST_URL = "/api/community/board?boardListType=FEED";

export function useBoardFeed(
  initial: {
    items: PostSummary[];
    page: number;
    isLast: boolean;
  },
  listUrl: string = FEED_LIST_URL,
) {
  const [items, setItems] = useState<PostSummary[]>(initial.items);
  const [page, setPage] = useState(initial.page);
  const [isLast, setIsLast] = useState(initial.isLast);
  const [status, setStatus] = useState<FeedStatus>("idle");
  // setState는 비동기라 연속 호출 사이 가드가 새므로, 진행 여부는 ref로 즉시 판정한다.
  const loadingRef = useRef(false);
  // reloadLoaded용 — 다음 페이지가 붙었는지를 await 뒤에 바로 알아야 해서 setPage와 같은 자리에서 맞춘다.
  const pageRef = useRef(initial.page);
  // reloadLoaded가 늦게 온 응답을 버리는 기준 — 마지막 다시 읽기 순번.
  const reloadSeqRef = useRef(0);
  // 마지막으로 페이지 경계를 맞춘 뒤 걷어 낸 글 — 서버 목록이 이만큼 당겨져 있다(#522). 되돌리면 뺀다.
  const shiftedIdsRef = useRef(new Set<number>());

  // 걷어낸 항목을 원래 위치와 함께 기억한다 — 되돌리기가 복원할 데이터를 목록만 알고 있기 때문.
  // (상세에서 숨긴 경우 상세는 이미 닫혀 있어 게시글 데이터를 들고 있지 않다.)
  const removedRef = useRef(new Map<number, { post: PostSummary; index: number }>());

  const loadMore = useCallback(async () => {
    if (loadingRef.current || isLast) return;

    loadingRef.current = true;
    setStatus("loading");
    const nextPage = page + 1;
    // 걷어 낸 k개만큼 서버 목록이 당겨져, 건너뛸 글은 서버 기준 (nextPage·size − k)번째부터다 — 그 페이지부터
    // 다시 받아 중복 제거로 붙인다. 걷어 낸 게 없으면 다음 페이지 하나만(지금과 같다).
    const shifted = [...shiftedIdsRef.current];
    const firstPage = Math.max(
      0,
      Math.floor((nextPage * FEED_PAGE_SIZE - shifted.length) / FEED_PAGE_SIZE),
    );

    try {
      const lists = await Promise.all(
        Array.from({ length: nextPage - firstPage + 1 }, (_, index) =>
          fetchFeedPage(listUrl, firstPage + index),
        ),
      );
      if (lists.some((list) => list === null)) {
        throw new Error("board list request failed");
      }
      const loaded = lists as PostList[];
      const list = loaded[loaded.length - 1];

      // 걷어 낸 글은 다시 붙이지 않는다 — 다시 받은 앞 페이지에 남아 있을 수 있다(저장 목록은 숨김 · 신고 글을
      // 빼지 않고, 받는 사이 걷어 낸 글은 서버가 아직 빼기 전일 수 있다).
      const removed = removedRef.current;
      setItems((prev) =>
        loaded.reduce(
          (merged, each) =>
            mergeUnique(
              merged,
              each.items.filter((post) => !removed.has(post.id)),
            ),
          prev,
        ),
      );
      // 이제 당겨진 서버 목록 기준으로 이어지므로 메운 만큼 비운다. 받는 사이 걷어 낸 글은 남긴다.
      for (const id of shifted) shiftedIdsRef.current.delete(id);
      pageRef.current = list.page;
      setPage(list.page);
      setIsLast(list.isLast);
      setStatus("idle");
    } catch {
      setStatus("error");
    } finally {
      loadingRef.current = false;
    }
  }, [isLast, listUrl, page]);

  // 카드 ⋮ 메뉴에서 삭제가 성공하면 목록에서 걷어낸다(서버 재조회 없이 즉시 반영).
  // page/isLast는 건드리지 않는다. 서버 목록은 그만큼 당겨지므로 걷어 낸 글을 기억해 두고, 다음 loadMore가
  // 당겨진 만큼 앞 페이지까지 다시 받아 경계의 글을 메운다(#522).
  const removePost = useCallback((postId: number) => {
    setItems((prev) => {
      const at = prev.findIndex((post) => post.id === postId);
      if (at < 0) return prev;

      // 같은 값을 두 번 써도 결과가 같아 updater가 재실행돼도 안전하다.
      removedRef.current.set(postId, { post: prev[at], index: at });
      shiftedIdsRef.current.add(postId);
      return prev.filter((post) => post.id !== postId);
    });
  }, []);

  /**
   * 숨기기 되돌리기 — 걷어냈던 카드를 원래 자리에 다시 끼워 넣는다.
   *
   * 맨 뒤에 붙이면 시간순 피드에서 글이 엉뚱한 위치로 튀므로 인덱스를 받아 같은 자리에 복원한다.
   * 그 사이 다음 페이지가 붙어 인덱스가 밀렸어도 대략 같은 구간에 놓이면 충분하다(정확한 정렬은
   * 다음 새로고침이 맞춘다). 이미 같은 id가 있으면 중복 삽입하지 않는다.
   */
  const restorePost = useCallback((post: PostSummary, index: number) => {
    setItems((prev) => {
      if (prev.some((item) => item.id === post.id)) return prev;
      // 되돌린 글은 서버 목록에도 돌아온다 — 경계를 맞추기 전이면 당겨진 수에서 뺀다.
      shiftedIdsRef.current.delete(post.id);
      const at = Math.min(Math.max(index, 0), prev.length);
      return [...prev.slice(0, at), post, ...prev.slice(at)];
    });
  }, []);

  /**
   * 서버에서 다시 읽은 게시글을 원래 자리에 그대로 끼워 넣는다(순서 · 스크롤 유지).
   *
   * 목록에 없는 id면 아무것도 하지 않는다 — 이미 걷어냈거나 아직 안 불러온 페이지의 글이라,
   * 여기서 새로 끼워 넣으면 시간순 피드에 엉뚱한 위치로 나타난다.
   */
  const replacePost = useCallback((post: PostSummary) => {
    setItems((prev) => {
      const at = prev.findIndex((item) => item.id === post.id);
      if (at < 0) return prev;

      const next = [...prev];
      next[at] = post;
      return next;
    });
  }, []);

  /**
   * 첫 페이지를 다시 읽어 새 글만 앞에 붙인다 — 작성 후 복귀용(#38).
   *
   * 누적된 items · page를 리셋하지 않는 이유: 리셋하면 그동안 이어붙인 페이지와 스크롤이 전부
   * 날아간다. 이미 있는 id는 건너뛰므로 페이지 경계가 겹쳐도 중복되지 않는다.
   */
  const prependNew = useCallback((fresh: PostSummary[]) => {
    setItems((prev) => {
      const seen = new Set(prev.map((post) => post.id));
      const added = fresh.filter((post) => !seen.has(post.id));
      return added.length > 0 ? [...added, ...prev] : prev;
    });
  }, []);

  /**
   * 걷어낸 카드를 기억해 둔 위치로 되돌린다 — 상세에서 숨긴 뒤의 되돌리기용.
   *
   * @returns 복원했으면 true. 기억이 없으면(아직 걷어내기 전이거나 이미 복원됨) false.
   */
  const restoreRemoved = useCallback(
    (postId: number): boolean => {
      const kept = removedRef.current.get(postId);
      if (!kept) return false;

      removedRef.current.delete(postId);
      restorePost(kept.post, kept.index);
      return true;
    },
    [restorePost],
  );

  /**
   * 지금까지 불러온 페이지를 다시 읽어 카드를 제자리에서 갈아 끼운다 — 로그인 직후 viewer 갱신용(#173).
   *
   * 첫 페이지로 리셋하지 않는 이유: 로그인은 카드의 좋아요를 누르다 뜬 알럿에서 시작되는데, 돌아왔을 때
   * 목록이 맨 위로 튀면 보던 글을 잃는다. 순서 · 추가 · 제거는 건드리지 않고 같은 id만 교체한다.
   * 실패한 페이지는 옛 값으로 남긴다(다음 복귀 재조회나 새로고침이 맞춘다).
   */
  const refreshLoaded = useCallback(async () => {
    const pages = Array.from({ length: page + 1 }, (_, index) => index);
    const lists = await Promise.all(
      pages.map((index) => fetchFeedPage(listUrl, index)),
    );
    const fresh = new Map(
      lists.flatMap((list) => list?.items ?? []).map((post) => [post.id, post]),
    );
    if (fresh.size === 0) return;

    setItems((prev) => prev.map((post) => fresh.get(post.id) ?? post));
  }, [listUrl, page]);

  /**
   * 지금까지 불러온 페이지를 다시 읽어 목록을 서버 기준으로 통째로 바꾼다 — 앱에서 회원 차단이 바뀐 뒤용(#488).
   *
   * refreshLoaded와 달리 빠지고 더해진 글도 반영한다. 차단은 그 회원의 글이 목록에서 빠지고(해제면 다시 나타나고)
   * 카드의 author.userId는 목록 응답에 없을 수 있어(0) 웹이 직접 골라낼 수 없다. 불러온 페이지 수는 그대로 둔다 —
   * 해제로 글이 늘면 끝의 몇 장은 다음 페이지로 밀려 빠지고(다음 loadMore가 다시 붙인다), 위에서 글이 빠지거나 끼면
   * 보던 카드도 그만큼 밀린다. 메시지는 피드가 가려진 동안 오고 다시 보일 때 한 번 반영되므로 감수한다.
   * 한 페이지라도 실패하면 손대지 않는다 — 일부만 바꾸면 페이지 사이 글이 빠지거나 겹친다.
   * 더 새 다시 읽기가 시작됐으면 이 결과는 버리고, 다시 읽는 사이 다음 페이지가 붙었으면 늘어난 범위로 다시 읽는다
   * (붙은 페이지는 차단 전 기준일 수 있고, 지금 결과로 바꾸면 그 페이지가 빠진다).
   */
  const reloadLoaded = useCallback(async () => {
    const seq = ++reloadSeqRef.current;

    for (;;) {
      const lastPage = pageRef.current;
      const pages = Array.from({ length: lastPage + 1 }, (_, index) => index);
      const lists = await Promise.all(
        pages.map((index) => fetchFeedPage(listUrl, index)),
      );
      if (seq !== reloadSeqRef.current) return;
      if (pageRef.current !== lastPage) continue;
      if (lists.some((list) => list === null)) return;

      const loaded = lists as PostList[];
      // 페이지 경계에서 같은 글이 두 번 올 수 있어 먼저 온 쪽만 남긴다.
      setItems(
        loaded.reduce<PostSummary[]>(
          (merged, list) => mergeUnique(merged, list.items),
          [],
        ),
      );
      setIsLast(loaded[loaded.length - 1].isLast);
      // 서버 기준으로 통째로 바꿨으니 페이지 경계도 맞춰졌다.
      shiftedIdsRef.current.clear();
      return;
    }
  }, [listUrl]);

  return {
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
    reloadLoaded,
  };
}

/** 목록 BFF 경로에 페이지 조건을 붙인다(page는 0부터). listUrl에 쿼리스트링이 없어도 동작한다. */
export function feedPageUrl(listUrl: string, page: number): string {
  const separator = listUrl.includes("?") ? "&" : "?";
  return `${listUrl}${separator}page=${page}&size=${FEED_PAGE_SIZE}`;
}

/** 한 페이지를 읽는다. 실패하면 null — 호출부가 옛 값을 유지한다. */
async function fetchFeedPage(
  listUrl: string,
  page: number,
): Promise<PostList | null> {
  try {
    const response = await bffFetch(feedPageUrl(listUrl, page));
    if (!response.ok) return null;

    const body = (await response.json().catch(() => null)) as
      | { data?: PostList }
      | null;
    return body?.data ?? null;
  } catch {
    return null;
  }
}

/** 이미 있는 id는 건너뛰고 새 항목만 이어 붙인다(페이지 경계 중복 방지). */
function mergeUnique(
  prev: PostSummary[],
  next: PostSummary[],
): PostSummary[] {
  const seen = new Set(prev.map((post) => post.id));
  const fresh = next.filter((post) => !seen.has(post.id));
  return fresh.length > 0 ? [...prev, ...fresh] : prev;
}
