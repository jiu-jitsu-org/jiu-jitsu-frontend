"use client";

import { useCallback, useRef } from "react";

import { useAuth } from "@/features/auth/presentation/auth-provider";
import type {
  BalanceGame,
  BalanceOptionKey,
} from "@/features/community/domain/balance-game";
import { bffFetch } from "@/shared/lib/http/bff-fetch";
import { useToast } from "@/shared/ui";

/**
 * 밸런스 게임 투표 — 요청을 보낼지 말지 판단하는 유일한 지점.
 *
 * 정책(2026-09-29 확정): 마감 전에는 취소·변경이 자유다(확인 모달·횟수 제한 없음).
 * 상태는 미참여/참여 둘뿐이고, 집계는 마감 시점의 최종 상태로 한다. 업스트림도 같은 규약이라
 * (같은 선택지 = 취소, 다른 선택지 = 변경, 득표는 COUNT) 이 훅은 선택지 조합을 막지 않고
 * 상황(세션·마감·요청 중)만 본다.
 *
 * 리스트 카드와 상세 패널이 같은 훅을 쓰므로, 마감 안내도 여기서 띄워 두 화면을 한 번에 맞춘다.
 */

/**
 * 투표 후의 선택 상태. 같은 선택지를 다시 누르면 취소(null)다.
 *
 * 업스트림 규약과 같은 규칙이라, 낙관적 반영값이 서버 확정값과 어긋나지 않는다.
 */
function nextVoteOf(
  myVote: BalanceOptionKey | null,
  option: BalanceOptionKey,
): BalanceOptionKey | null {
  return myVote === option ? null : option;
}

export function useBalanceVote({
  game,
  onVoted,
}: {
  game: BalanceGame;
  /** 낙관적 반영과 서버 확정값 반영에 모두 쓰인다. */
  onVoted: (next: BalanceGame) => void;
}): (option: BalanceOptionKey) => void {
  const { status, requireAuth } = useAuth();
  const toast = useToast();

  // 요청이 끝나기 전 재탭을 막는다. 이건 UX 개선이 아니라 기능 요구사항이다 —
  // 같은 선택지가 두 번 도착하면 업스트림이 두 번째를 "취소"로 처리해 투표가 풀리고,
  // A→B 연타는 낙관적 값과 응답 도착 순서가 엇갈려 화면이 서버와 다른 선택지에 멈출 수 있다.
  const votingRef = useRef(false);

  return useCallback(
    (option: BalanceOptionKey) => {
      // 세션 판정 전에는 아무 판단도 하지 않는다. loading을 비로그인으로 보면
      // 로그인한 사용자에게 로그인 유도가 뜬다.
      if (status === "loading") return;

      // 마감 확인이 로그인보다 앞선다: 마감된 판은 로그인해도 투표할 수 없어, 먼저 물으면
      // 아무것도 할 수 없는 사용자에게 로그인을 요구하게 된다.
      // 서버도 C0007로 막지만 굳이 왕복해서 실패를 받을 이유가 없다.
      // 안내를 띄우는 이유: 사용자는 마감된 줄 모르고 눌렀고, 반응이 없으면 앱이 멈춘 것처럼 보인다.
      if (game.closed) {
        toast.show("마감된 밸런스 게임이에요");
        return;
      }

      if (status !== "authenticated") {
        // no-op을 넘기는 이유: requireAuth는 로그인 성공 시 보관한 행위를 자동 실행한다.
        // 정책은 "로그인 후 다시 눌러야 함"이라 복귀시킬 행위를 비워 둔다.
        requireAuth(() => {}, { reason: "밸런스 게임 투표" });
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
    [game, onVoted, requireAuth, status, toast],
  );
}
