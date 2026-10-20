"use client";

import { useCallback, useRef, useState } from "react";

import type {
  BalanceGame,
  BalanceGameList,
} from "@/features/community/domain/balance-game";
import { MY_BALANCE_GAME_LIST_URL } from "@/features/community/presentation/my-activity/my-activity-tab";
import { feedPageUrl } from "@/features/community/presentation/use-board-feed";
import { bffFetch } from "@/shared/lib/http/bff-fetch";

type FeedStatus = "idle" | "loading" | "error";

/**
 * 참여한 밸런스 게임 목록의 무한 스크롤 상태 훅.
 *
 * 메인 피드 훅(useBoardFeed)의 loadMore만 떼어 온 축소판이다 — 이 목록은 항목이 BalanceGame이고
 * 삭제 · 숨기기 · 복귀 재조회가 없어 나머지가 필요 없다. 규칙은 같다:
 * - 첫 페이지는 Server Component가 seed로 넘기고, 이후 페이지는 BFF로 이어 붙인다.
 * - 동시/중복 로드는 ref로 막고, 페이지 경계 중복은 contentId로 거른다.
 * - 실패하면 status="error"로 두고 loadMore 재호출(재시도)로 같은 페이지를 다시 시도한다.
 */
export function useMyBalanceGameFeed(initial: {
  items: BalanceGame[];
  page: number;
  isLast: boolean;
}) {
  const [items, setItems] = useState(initial.items);
  const [page, setPage] = useState(initial.page);
  const [isLast, setIsLast] = useState(initial.isLast);
  const [status, setStatus] = useState<FeedStatus>("idle");
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || isLast) return;

    loadingRef.current = true;
    setStatus("loading");

    try {
      const response = await bffFetch(
        feedPageUrl(MY_BALANCE_GAME_LIST_URL, page + 1),
      );
      if (!response.ok) {
        throw new Error(`balance game list request failed: ${response.status}`);
      }

      const body = (await response.json().catch(() => null)) as
        | { data?: BalanceGameList }
        | null;
      const list = body?.data;
      if (!list) throw new Error("balance game list response has no data");

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

/** 이미 있는 contentId는 건너뛰고 새 항목만 이어 붙인다(페이지 경계 중복 방지). */
function mergeUnique(prev: BalanceGame[], next: BalanceGame[]): BalanceGame[] {
  const seen = new Set(prev.map((game) => game.contentId));
  const fresh = next.filter((game) => !seen.has(game.contentId));
  return fresh.length > 0 ? [...prev, ...fresh] : prev;
}
