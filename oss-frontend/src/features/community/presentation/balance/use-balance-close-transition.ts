"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";

import type { BalanceGame } from "@/features/community/domain/balance-game";
import { bffFetch } from "@/shared/lib/http/bff-fetch";
import { useToast } from "@/shared/ui";

/**
 * 상세를 보는 중 카운트다운이 0에 닿았을 때의 전환.
 *
 * 정책상 **화면을 벗어나지 않는다** — 투표 영역만 마감 상태로 바뀌고 댓글과 스크롤 위치는
 * 그대로다. 읽던 위치에서 화면이 튀지 않아야 한다.
 *
 * 하는 일이 두 가지라 조회도 둘이다:
 *
 * 1. **보고 있던 판의 최종 상태**(getById) — 화면에 떠 있는 투표율은 마지막 투표 응답 시점의
 *    값이라, 그 뒤 들어온 표가 빠져 있다. 마감 결과는 한 번 굳으면 계속 남는 숫자라 여기서
 *    최종 집계로 갈아탄다.
 * 2. **새로 시작된 판**(getCurrent) — 안내 토스트의 이동 대상이다. 없으면 버튼 없이 안내만 한다.
 *
 * 둘은 서로를 기다릴 이유가 없어 병렬로 읽는다. 1이 실패해도 마감 표시는 해야 하므로
 * 로컬에서 closed만 뒤집는 것으로 물러선다 — 숫자가 조금 낡을 뿐 화면은 정상 동작한다.
 */

/** 마감 안내. 타이머 자리 문구("투표가 종료되었어요")와 짝을 이룬다. */
const CLOSED_TOAST = "투표가 종료됐어요";

/** 새 판으로 넘어가는 버튼. 정책 문구를 그대로 쓴다. */
const OPEN_NEW_GAME_LABEL = "오늘의 밸런스 게임 보기";

async function readJsonData<T>(path: string): Promise<T | null> {
  try {
    const response = await bffFetch(path);
    if (!response.ok) return null;

    const body = (await response.json().catch(() => null)) as {
      data?: T | null;
    } | null;

    return body?.data ?? null;
  } catch {
    return null;
  }
}

export function useBalanceCloseTransition({
  contentId,
  onClosed,
}: {
  contentId: number;
  /** 마감 상태로 굳은 게임. 재조회에 실패하면 호출부가 로컬로 closed만 뒤집도록 null이 온다. */
  onClosed: (finalGame: BalanceGame | null) => void;
}): () => void {
  const router = useRouter();
  const toast = useToast();

  /**
   * 이미 전환을 마친 판의 contentId.
   *
   * 가드가 필요한 이유: 재조회로 게임을 갈아끼우면 잔여 시간이 0인 새 값으로 카운트다운
   * effect가 다시 시작되고, 그 첫 계산에서 다시 0에 닿아 만료를 한 번 더 알린다. 막지 않으면
   * 조회와 토스트가 무한히 반복된다.
   *
   * boolean이 아니라 **contentId를 담는 이유**: 토스트로 다음 판에 들어가면 같은 위치의
   * 컴포넌트가 재사용될 수 있어 ref가 살아남는다. 단순 플래그면 그 판은 마감돼도 전환하지
   * 못한다. 판이 바뀌면 다시 한 번 전환할 수 있어야 한다.
   */
  const transitionedForRef = useRef<number | null>(null);

  return useCallback(() => {
    if (transitionedForRef.current === contentId) return;
    transitionedForRef.current = contentId;

    void (async () => {
      const [finalGame, nextGame] = await Promise.all([
        readJsonData<BalanceGame>(`/api/community/balance-game/${contentId}`),
        readJsonData<BalanceGame>("/api/community/balance-game"),
      ]);

      onClosed(finalGame);

      // 서버가 아직 다음 판으로 교체하지 않았으면 방금 마감된 판이 그대로 온다.
      // 그쪽으로 보내면 같은 화면을 다시 여는 셈이라 이동 버튼을 주지 않는다.
      const hasNextGame = nextGame !== null && nextGame.contentId !== contentId;

      if (!hasNextGame) {
        toast.show(CLOSED_TOAST);
        return;
      }

      toast.show(CLOSED_TOAST, {
        label: OPEN_NEW_GAME_LABEL,
        onAction: () => {
          // push가 아니라 replace다 — 마감된 판은 뒤로가기로 돌아갈 곳이 아니다.
          // 뒤로가면 들어온 곳(피드)으로 나가는 편이 자연스럽다.
          router.replace(`/community/balance/${nextGame.contentId}`);
        },
      });
    })();
  }, [contentId, onClosed, router, toast]);
}
