"use client";

import { useCallback, useEffect, useRef } from "react";

import { isDevelopmentRuntime } from "@/config/env";
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

/**
 * 투표를 낙관적으로 반영한 게임 — 선택 상태뿐 아니라 **득표수도 함께** 옮긴다.
 *
 * 선택 상태만 바꾸면 바는 내 표가 빠진 옛 비율로 먼저 차오르다가, 서버 응답이 오는 순간 새 비율로
 * 다시 꺾인다(스프링 도중에 목표가 바뀌어 바가 끊겨 보인다). 내 표를 미리 더해 두면 서버 확정값과
 * 같은 비율로 한 번에 차오른다.
 */
function applyVote(
  game: BalanceGame,
  next: BalanceOptionKey | null,
): BalanceGame {
  const delta = (key: BalanceOptionKey) =>
    (next === key ? 1 : 0) - (game.myVote === key ? 1 : 0);

  return {
    ...game,
    myVote: next,
    optionA: {
      ...game.optionA,
      voteCount: Math.max(0, game.optionA.voteCount + delta("A")),
    },
    optionB: {
      ...game.optionB,
      voteCount: Math.max(0, game.optionB.voteCount + delta("B")),
    },
    totalVoteCount: Math.max(
      0,
      game.totalVoteCount + delta("A") + delta("B"),
    ),
  };
}

/**
 * (dev 전용) 체험 투표 — `next dev`에서 주소에 `?sample=1`을 붙이면 로그인 없이 화면에서만 고르고 바꾸고
 * 취소할 수 있다. 서버에는 보내지 않는다. 투표 뒤 모션·물들임을 직접 눌러 보며 다듬으려고 둔다.
 * production 빌드에서는 늘 false다.
 */
function isSampleVoting(): boolean {
  if (!isDevelopmentRuntime() || typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("sample") === "1";
}

/** 서버와 맞추는 중인 투표 상태. */
type VoteSync = {
  /** 서버가 마지막으로 확정한 판 — 실패하면 여기로 되돌린다. */
  confirmed: BalanceGame;
  /** 사용자가 마지막으로 누른 결과. */
  desired: BalanceOptionKey | null;
};

export function useBalanceVote({
  game,
  onVoted,
}: {
  game: BalanceGame;
  /** 낙관적 반영과 서버 확정값 반영에 모두 쓰인다. */
  onVoted: (next: BalanceGame) => void;
}): (option: BalanceOptionKey) => void {
  const { status, promptLogin } = useAuth();
  const toast = useToast();

  // 서버와 맞추는 중인 투표(#324). 탭은 막지 않는다 — 누를 때마다 화면은 바로 바뀌고, 요청은 한 번에
  // 하나씩만 보내 마지막 상태로 맞춘다. 동시에 보내면 업스트림이 같은 선택지 두 번째를 "취소"로 처리하고,
  // 응답 도착 순서가 엇갈려 화면이 서버와 다른 선택지에 멈출 수 있다.
  const syncRef = useRef<VoteSync | null>(null);

  // 지금 화면의 판(화면을 떠났으면 null). 요청을 기다리는 사이 다음 판으로 바뀌었거나 마감됐으면
  // 늦게 온 결과로 덮지 않는다 — 옛 판이 되살아나거나 마감 판이 다시 열린다.
  const currentGameRef = useRef<BalanceGame | null>(game);
  useEffect(() => {
    currentGameRef.current = game;
    return () => {
      currentGameRef.current = null;
    };
  }, [game]);

  const applySettled = useCallback(
    (settled: BalanceGame) => {
      const current = currentGameRef.current;
      if (current?.contentId !== settled.contentId || current.closed) return;
      onVoted(settled);
    },
    [onVoted],
  );

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
        toast.show("마감된 밸런스 게임이에요", { tone: "warning" });
        return;
      }

      if (isSampleVoting()) {
        onVoted(applyVote(game, nextVoteOf(game.myVote, option)));
        return;
      }

      if (status !== "authenticated") {
        // 유도만 한다 — 정책은 "로그인 후 다시 눌러야 함"이라 투표를 자동 복귀시키지 않는다.
        promptLogin({ reason: "밸런스 게임 투표" });
        return;
      }

      // 이전 판의 요청이 끝나기 전에 다음 판으로 바뀐 경우 — 두 판의 상태가 섞이지 않게 끝날 때까지 기다린다.
      const running = syncRef.current;
      if (running && running.confirmed.contentId !== game.contentId) return;

      // 낙관적 반영 — 탭과 색 반전 사이에 왕복 시간이 끼면 눌린 것 같지 않다.
      // 같은 선택지를 다시 누른 경우는 취소라 null이 된다.
      const next = nextVoteOf(game.myVote, option);
      onVoted(applyVote(game, next));

      if (running) {
        // 보내고 있는 요청이 끝나면 아래 반복문이 이 상태로 맞춘다.
        running.desired = next;
        return;
      }

      const sync: VoteSync = { confirmed: game, desired: next };
      syncRef.current = sync;

      void (async () => {
        try {
          let sent: BalanceOptionKey | null;
          do {
            sent = sync.desired;
            // 업스트림 규약: 같은 선택지 = 취소, 다른 선택지 = 변경. 취소하려면 지금 서버의 선택지를 보낸다.
            const voteOption = sent ?? sync.confirmed.myVote;
            if (voteOption === null) break; // 고르고 바로 취소해 서버와 이미 같다.

            const response = await bffFetch(
              `/api/community/balance-game/${sync.confirmed.contentId}/vote`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ option: voteOption }),
              },
            );

            if (!response.ok) {
              applySettled(sync.confirmed);
              return;
            }

            const body = (await response.json().catch(() => null)) as
              | { data?: BalanceGame }
              | null;

            // 본문을 못 읽어도 투표 자체는 성공했으므로 규약대로 바뀐 것으로 본다.
            sync.confirmed =
              body?.data ??
              applyVote(
                sync.confirmed,
                nextVoteOf(sync.confirmed.myVote, voteOption),
              );

            // 응답을 기다리는 사이 또 눌렸으면 그 상태로 다시 보낸다. 안 눌렸으면 서버 응답을 그대로 믿고 끝낸다
            // (다시 보내면 응답이 뜻밖일 때 끝없이 반복한다).
          } while (
            sync.desired !== sent &&
            sync.desired !== sync.confirmed.myVote
          );

          // 맞추는 동안에는 응답을 화면에 넣지 않는다 — 누르는 도중 줄이 되돌아갔다 다시 켜진다.
          // 끝났을 때 한 번만 서버 확정값(다른 사용자의 투표까지 반영된 최신 상태)으로 덮어쓴다.
          applySettled(sync.confirmed);
        } catch {
          applySettled(sync.confirmed);
        } finally {
          syncRef.current = null;
        }
      })();
    },
    // 실패 문구는 아직 정해지지 않았다 → 롤백만 하고 아무것도 띄우지 않는다(정책: 동작 안 함).
    [applySettled, game, onVoted, promptLogin, status, toast],
  );
}
