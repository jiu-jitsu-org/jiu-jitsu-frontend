"use client";

import { useCallback, useState } from "react";

import type {
  BalanceGame,
  BalanceOptionKey,
} from "@/features/community/domain/balance-game";
import {
  BalanceOptionButton,
  type BalanceOptionState,
} from "@/features/community/presentation/balance/balance-option-button";
import { BalanceRemaining } from "@/features/community/presentation/balance/balance-remaining";
import { readOptionResult } from "@/features/community/presentation/balance/balance-result";
import { canToggleVote } from "@/features/community/presentation/balance/balance-vote-policy";
import { useBalanceCloseTransition } from "@/features/community/presentation/balance/use-balance-close-transition";
import {
  useBalanceVote,
  type BalanceVoteBlockReason,
} from "@/features/community/presentation/balance/use-balance-vote";
import { useToast } from "@/shared/ui";

/**
 * 상세의 투표 영역 — 타이머와 선택지, 그리고 게임 상태를 소유한다.
 *
 * 상세에서 이 블록만 클라이언트인 이유: 투표하면 화면이 즉시 바뀌어야 하는데(낙관적 반영),
 * 댓글까지 클라이언트로 끌어올릴 이유는 없다. 댓글은 서버 렌더 상태 그대로 두고 이 패널만
 * 상태를 가진다 — 게시글 상세가 액션바만 클라이언트 leaf로 두는 것과 같은 분할이다.
 *
 * 리스트(BalanceGameSection)와 달리 포그라운드 복귀 재조회를 두지 않는다. 상세는 지목한 판에
 * 머물러야 하므로 복귀했다고 다음 판을 끌어오면 안 된다. 유일한 재조회는 마감 전환뿐이고,
 * 그때도 화면은 그 판에 남는다(다음 판은 토스트 버튼으로만 간다).
 */
export function BalanceVotePanel({ initialGame }: { initialGame: BalanceGame }) {
  const [game, setGame] = useState(initialGame);
  const toast = useToast();

  // SSR이 다시 돌아 새 seed가 내려오면(세션 복구 후 router.refresh 등) 그 값으로 갈아탄다.
  // 클라이언트 인스턴스는 살아 있어 state가 알아서 바뀌지 않는다(BalanceGameSection과 같은 패턴).
  const [seededGame, setSeededGame] = useState(initialGame);
  if (seededGame !== initialGame) {
    setSeededGame(initialGame);
    setGame(initialGame);
  }

  /**
   * 막힌 탭에 대한 안내.
   *
   * 마감만 알린다 — 사용자는 마감된 줄 모르고 눌렀고, 아무 반응이 없으면 앱이 멈춘 것처럼 보인다.
   * 재투표 제한(policy)은 정책상 "반응 없음"이 의도된 피드백이라 그대로 둔다.
   */
  const handleBlocked = useCallback(
    (reason: BalanceVoteBlockReason) => {
      if (reason !== "closed") return;
      toast.show("마감된 밸런스 게임이에요");
    },
    [toast],
  );

  const vote = useBalanceVote({
    game,
    onVoted: setGame,
    onBlocked: handleBlocked,
  });

  /**
   * 마감 전환 — 최종 집계로 갈아끼운다.
   *
   * 재조회에 실패하면(null) 화면에 있는 값을 그대로 두고 closed만 뒤집는다. 투표율이 조금
   * 낡을 뿐, 마감 표시조차 못 하는 것보다는 낫다.
   */
  const handleClosed = useCallback((finalGame: BalanceGame | null) => {
    setGame((previous) => finalGame ?? { ...previous, closed: true });
  }, []);

  const handleExpired = useBalanceCloseTransition({
    contentId: game.contentId,
    onClosed: handleClosed,
  });

  /** 눌러서 상태가 바뀔 수 있는지 — 커서 표현에만 쓴다(리스트 카드와 같은 규칙). */
  const isInteractive = (option: BalanceOptionKey) =>
    !game.closed && canToggleVote(game.myVote, option);

  /**
   * 선택지 표시 상태.
   *
   * 마감 여부를 보지 않는 것이 의도적이다 — 마감 후 배경 강조는 사라지지만(readOptionResult가
   * emphasized: false를 준다) 캐릭터는 내가 고른 그대로 남는다. 배경 색이 빠져도 무엇을
   * 골랐는지는 읽을 수 있어야 한다는 판단이고, 크기가 유지되므로 전환 시 행 높이도 그대로다.
   */
  const optionState = (option: BalanceOptionKey): BalanceOptionState => {
    if (game.myVote === null) return "default";
    return game.myVote === option ? "selected" : "unselected";
  };

  return (
    <>
      {/*
        타이머는 리스트와 달리 알약(pill) 안에 들어간다. 가운데 정렬을 위해 한 겹 감싼다 —
        inline-flex인 pill 자체는 자기 폭만 차지한다.

        FIXME(Phase 8): pill 배경·여백은 디자인 가이드 전 잠정값이다(캡처 기준).
      */}
      <div className="mt-4 flex justify-center">
        <span className="inline-flex items-center rounded-full bg-surface-secondary px-4 py-2 text-feed-card-header-date-text">
          {/* 깜빡임과 마감 문구는 상세 전용이다(리스트·sticky 바는 쓰지 않는다). */}
          <BalanceRemaining
            endAt={game.endAt}
            serverTime={game.serverTime}
            onExpired={handleExpired}
            showIcon
            blinkIcon
            closed={game.closed}
          />
        </span>
      </div>

      {/* 선택지 사이 4 — 리스트와 같다 */}
      <div className="mt-5 flex flex-col gap-1">
        <BalanceOptionButton
          option={game.optionA}
          state={optionState("A")}
          interactive={isInteractive("A")}
          result={readOptionResult(game, "A")}
          onPress={() => vote("A")}
        />
        <BalanceOptionButton
          option={game.optionB}
          state={optionState("B")}
          interactive={isInteractive("B")}
          result={readOptionResult(game, "B")}
          onPress={() => vote("B")}
        />
      </div>
    </>
  );
}
