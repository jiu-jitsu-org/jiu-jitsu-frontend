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
 * - 실패하면 status="error"로 두고 loadMore 재호출(재시도)로 같은 페이지를 다시 시도한다.
 */
type FeedStatus = "idle" | "loading" | "error";

export function useBoardFeed(initial: {
  items: PostSummary[];
  page: number;
  isLast: boolean;
}) {
  const [items, setItems] = useState<PostSummary[]>(initial.items);
  const [page, setPage] = useState(initial.page);
  const [isLast, setIsLast] = useState(initial.isLast);
  const [status, setStatus] = useState<FeedStatus>("idle");
  // setState는 비동기라 연속 호출 사이 가드가 새므로, 진행 여부는 ref로 즉시 판정한다.
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || isLast) return;

    loadingRef.current = true;
    setStatus("loading");
    const nextPage = page + 1;

    try {
      const response = await bffFetch(
        `/api/community/board?boardListType=FEED&page=${nextPage}&size=${FEED_PAGE_SIZE}`,
      );
      if (!response.ok) {
        throw new Error(`board list request failed: ${response.status}`);
      }

      const body = (await response.json().catch(() => null)) as
        | { data?: PostList }
        | null;
      const list = body?.data;
      if (!list) throw new Error("board list response has no data");

      setItems((prev) => mergeUnique(prev, list.items));
      setPage(list.page);
      setIsLast(list.isLast);
      setStatus("idle");
    } catch {
      setStatus("error");
    } finally {
      loadingRef.current = false;
    }
  }, [isLast, page]);

  return { items, isLast, status, loadMore };
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
