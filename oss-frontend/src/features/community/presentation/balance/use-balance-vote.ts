"use client";

import { useCallback, useRef } from "react";

import { useAuth } from "@/features/auth/presentation/auth-provider";
import type {
  BalanceGame,
  BalanceOptionKey,
} from "@/features/community/domain/balance-game";
import {
  canToggleVote,
  nextVoteOf,
} from "@/features/community/presentation/balance/balance-vote-policy";
import { bffFetch } from "@/shared/lib/http/bff-fetch";

/**
 * 밸런스 게임 투표 — 요청을 보낼지 말지 판단하는 유일한 지점.
 *
 * 무엇을 허용할지(취소·변경)는 balance-vote-policy가 알고, 이 훅은 상황(세션·마감·요청 중)을
 * 얹어 최종 판단만 한다. 서버는 취소/변경을 모두 허용하므로 여기서 막지 않으면 그대로 나간다.
 */

/**
 * 탭을 막은 이유. 호출부가 안내를 띄울지 말지 고르는 데 쓴다.
 *
 * 리스트는 어느 쪽도 안내하지 않고(카드 위에서 조용히 아무 일 없음), 상세는 `closed`만
 * 토스트로 알린다 — 마감은 사용자가 모르고 누른 것이지만, 재투표 제한은 정책상 "반응 없음"이
 * 곧 의도된 피드백이다.
 */
export type BalanceVoteBlockReason = "closed" | "policy";


export function useBalanceVote({
  game,
  onVoted,
  onBlocked,
}: {
  game: BalanceGame;
  /** 낙관적 반영과 서버 확정값 반영에 모두 쓰인다. */
  onVoted: (next: BalanceGame) => void;
  /**
   * 탭이 투표로 이어지지 않았을 때. 넘기지 않으면 지금까지처럼 조용히 무시한다.
   *
   * 세션 없음은 여기로 오지 않는다 — 그쪽은 이미 로그인 유도라는 반응이 있다.
   */
  onBlocked?: (reason: BalanceVoteBlockReason) => void;
}): (option: BalanceOptionKey) => void {
  const { status, requireAuth } = useAuth();

  // 요청이 끝나기 전 재탭을 막는다. 이건 UX 개선이 아니라 기능 요구사항이다 —
  // 같은 선택지가 두 번 도착하면 업스트림이 두 번째를 "취소"로 처리해 투표가 풀린다.
  const votingRef = useRef(false);

  return useCallback(
    (option: BalanceOptionKey) => {
      // 세션 판정 전에는 아무 판단도 하지 않는다. loading을 비로그인으로 보면
      // 로그인한 사용자에게 로그인 유도가 뜬다.
      if (status === "loading") return;

      // 마감 확인이 로그인보다 앞선다: 마감된 판은 로그인해도 투표할 수 없어, 먼저 물으면
      // 아무것도 할 수 없는 사용자에게 로그인을 요구하게 된다.
      // 서버도 C0007로 막지만 굳이 왕복해서 실패를 받을 이유가 없다.
      if (game.closed) {
        onBlocked?.("closed");
        return;
      }

      if (status !== "authenticated") {
        // no-op을 넘기는 이유: requireAuth는 로그인 성공 시 보관한 행위를 자동 실행한다.
        // 정책은 "로그인 후 다시 눌러야 함"이라 복귀시킬 행위를 비워 둔다.
        requireAuth(() => {}, { reason: "밸런스 게임 투표" });
        return;
      }

      // 정책이 막는 조합(지금은 다른 선택지로 변경)은 눌러도 아무 일이 없다.
      // "반응 없음"이 곧 의도된 피드백이라 호출부에도 안내를 권하지 않는다.
      if (!canToggleVote(game.myVote, option)) {
        onBlocked?.("policy");
        return;
      }

      if (votingRef.current) return;
      votingRef.current = true;

      // 낙관적 반영 — 탭과 색 반전 사이에 왕복 시간이 끼면 눌린 것 같지 않다.
      // 같은 선택지를 다시 누른 경우는 취소라 null이 된다(업스트림 규약과 같은 규칙이라
      // 낙관적 값이 곧 서버 확정값과 일치한다).
      const previous = game;
      onVoted({ ...game, myVote: nextVoteOf(game.myVote, option) });

      void (async () => {
        try {
          const response = await bffFetch(
            `/api/community/balance-game/${game.contentId}/vote`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ option }),
            },
          );

          if (!response.ok) {
            onVoted(previous);
            return;
          }

          const body = (await response.json().catch(() => null)) as
            | { data?: BalanceGame }
            | null;

          // 서버 확정값으로 덮어쓴다 — 그 사이 다른 사용자의 투표까지 반영된 최신 상태다.
          // 본문을 못 읽어도 투표 자체는 성공했으므로 낙관적 상태를 유지한다.
          if (body?.data) onVoted(body.data);
        } catch {
          onVoted(previous);
        } finally {
          votingRef.current = false;
        }
      })();
    },
    // 실패 문구는 아직 정해지지 않았다 → 롤백만 하고 아무것도 띄우지 않는다(정책: 동작 안 함).
    [game, onBlocked, onVoted, requireAuth, status],
  );
}
