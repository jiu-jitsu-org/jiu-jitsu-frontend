"use client";

import type { MouseEvent } from "react";

import { BalanceOptionButton } from "@/features/community/presentation/balance/balance-option-button";
import type {
  BalanceGame,
  BalanceOptionKey,
} from "@/features/community/domain/balance-game";
import { CommentIcon, TimerIcon } from "@/shared/ui/icons";

/**
 * 밸런스 게임 풀 카드 — 피드 최상단에 고정 노출된다.
 *
 * 순수 뷰다. 조회·투표·카운트다운은 모두 상위(BalanceGameSection)가 소유하고, 이 컴포넌트는
 * 받은 값을 그리고 탭을 콜백으로 위임한다.
 *
 * FIXME(디자인 가이드 미적용): 디자인 가이드를 받지 못해 간격·타이포·크기는 캡처와 기존 카드
 * (FeedCard) 관례를 보고 잡은 잠정값이다. 색은 토큰(poll-*)을 쓰므로 그대로 두고, 치수만
 * 가이드가 나오면 맞춘다. 구조(탭 분기·요소 순서)는 기능 요구사항이라 바뀌지 않는다.
 *
 * 탭이 두 갈래로 갈리는 것이 이 카드의 핵심이다:
 * - 선택지(A/B) → 투표만. 상세로 이동하지 않는다
 * - 그 외 영역(제목·타이머·여백)과 댓글 링크 → 상세로 이동
 * FeedCard와 같은 방식으로 처리한다 — 카드를 button으로 감싸면 내부 버튼이 중첩되므로,
 * section에 클릭만 얹고 이벤트 출처가 button/a면 무시한다.
 */
export function BalanceGameCard({
  game,
  /** 이미 완성된 잔여 시간 문구(예: "20시간 15분 46초 남음"). 카운트다운은 상위가 계산한다. */
  remainingLabel,
  onVote,
  onPressDetail,
}: {
  game: BalanceGame;
  remainingLabel: string;
  onVote: (option: BalanceOptionKey) => void;
  onPressDetail: () => void;
}) {
  // 투표가 끝난 상태 = 이미 골랐거나 마감된 판. 표현(커서)에만 쓰고 실제 차단은 투표 훅이 한다.
  const locked = game.myVote !== null || game.closed;

  function handleCardPress(event: MouseEvent<HTMLElement>) {
    if (event.target instanceof Element && event.target.closest("button, a")) {
      return;
    }
    onPressDetail();
  }

  return (
    <section
      onClick={handleCardPress}
      className="flex cursor-pointer flex-col bg-surface-container px-4"
      aria-label="오늘의 밸런스 게임"
    >
      {/* 제목·타이머는 가운데 정렬 — 카드 안에서 선택지 묶음보다 상위 정보라는 것을 위계로 드러낸다. */}
      <h2 className="text-center text-title-3 text-text-primary">
        오늘의 밸런스 게임
      </h2>

      <p className="mt-1 flex items-center justify-center gap-1 text-text-tertiary">
        <TimerIcon size={16} />
        {/*
          매초 바뀌는 값이라 스크린리더가 계속 읽지 않도록 aria-live를 두지 않는다.
          남은 시간은 보조 정보이고, 마감되면 카드 자체가 다음 판으로 교체된다.
        */}
        <span className="text-label-m">{remainingLabel}</span>
      </p>

      {/* 선택지 사이 간격 8 */}
      <div className="mt-3 flex flex-col gap-2">
        <BalanceOptionButton
          option={game.optionA}
          selected={game.myVote === "A"}
          locked={locked}
          onPress={() => onVote("A")}
        />
        <BalanceOptionButton
          option={game.optionB}
          selected={game.myVote === "B"}
          locked={locked}
          onPress={() => onVote("B")}
        />
      </div>

      {/* 댓글 링크는 우측 정렬 — 카드를 끝맺는 보조 동선이라 시선 흐름의 끝에 둔다. */}
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={onPressDetail}
          className="flex cursor-pointer items-center gap-1 text-text-tertiary"
        >
          <CommentIcon size={16} />
          <span className="text-label-m">
            {/* 댓글이 없으면 "보러 갈 것"이 없다 — 첫 댓글을 유도하는 문구로 바꾼다. */}
            {game.commentCount > 0 ? "댓글 보러가기" : "첫 댓글 남기러 가기"}
          </span>
        </button>
      </div>
    </section>
  );
}
