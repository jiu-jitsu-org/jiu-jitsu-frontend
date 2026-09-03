"use client";

import type { MouseEvent } from "react";

import {
  BalanceOptionButton,
  type BalanceOptionState,
} from "@/features/community/presentation/balance/balance-option-button";
import { BalanceRemaining } from "@/features/community/presentation/balance/balance-remaining";
import { canToggleVote } from "@/features/community/presentation/balance/balance-vote-policy";
import type {
  BalanceGame,
  BalanceOptionKey,
} from "@/features/community/domain/balance-game";
import { CommentIcon } from "@/shared/ui/icons";

/**
 * 밸런스 게임 풀 카드 — 피드 최상단에 고정 노출된다.
 *
 * 순수 뷰다. 조회·투표·카운트다운은 모두 상위(BalanceGameSection)가 소유하고, 이 컴포넌트는
 * 받은 값을 그리고 탭을 콜백으로 위임한다.

 *
 * 탭이 두 갈래로 갈리는 것이 이 카드의 핵심이다:
 * - 선택지(A/B) → 투표만. 상세로 이동하지 않는다
 * - 그 외 영역(제목·타이머·여백)과 댓글 링크 → 상세로 이동
 * FeedCard와 같은 방식으로 처리한다 — 카드를 button으로 감싸면 내부 버튼이 중첩되므로,
 * section에 클릭만 얹고 이벤트 출처가 button/a면 무시한다.
 */
export function BalanceGameCard({
  game,
  onVote,
  onPressDetail,
  onExpired,
}: {
  game: BalanceGame;
  onVote: (option: BalanceOptionKey) => void;
  onPressDetail: () => void;
  /** 잔여 시간이 0에 닿았을 때(다음 판 재조회 트리거). 카드만 넘긴다 — BalanceRemaining 주석 참조. */
  onExpired?: () => void;
}) {
  /**
   * 이 선택지를 눌러 상태가 바뀔 수 있는지 — 커서 표현에만 쓴다.
   *
   * 선택지마다 답이 다르다. 지금 정책은 "내가 고른 것 재탭 = 취소(가능)",
   * "다른 것으로 변경(불가)"이라, 투표 후에는 A와 B의 커서가 갈린다.
   * 판단 출처는 투표 훅과 같은 balance-vote-policy다.
   */
  const isInteractive = (option: BalanceOptionKey) =>
    !game.closed && canToggleVote(game.myVote, option);

  /**
   * 선택지 표시 상태.
   *
   * 아무도 고르지 않은 default와, 상대를 골라서 밀려난 unselected는 다르다 — 행 배경도 글자색도
   * 같지만 캐릭터가 갈린다(회색 곁눈질 ↔ 컬러 슬픔, 크기도 66 ↔ 54.62).
   * 그래서 "선택됨 여부"가 아니라 세 값으로 넘긴다.
   */
  const optionState = (option: BalanceOptionKey): BalanceOptionState => {
    if (game.myVote === null) return "default";
    return game.myVote === option ? "selected" : "unselected";
  };

  function handleCardPress(event: MouseEvent<HTMLElement>) {
    if (event.target instanceof Element && event.target.closest("button, a")) {
      return;
    }
    onPressDetail();
  }

  return (
    <section
      onClick={handleCardPress}
      // 배경을 두지 않는다 — 피드 배경이 그대로 비쳐야 한다(디자인). 좌우 16만 준다.
      className="flex cursor-pointer flex-col px-4"
      aria-label="오늘의 밸런스 게임"
    >
      {/* 제목·타이머는 가운데 정렬 — 카드 안에서 선택지 묶음보다 상위 정보라는 것을 위계로 드러낸다. */}
      <h2 className="text-center text-title-1 text-feed-card-body-title-text">
        오늘의 밸런스 게임
      </h2>

      {/* 매초 바뀌는 문구는 BalanceRemaining 안에 갇혀 있다 — 카드는 초마다 리렌더되지 않는다. */}
      <p className="mt-2 text-center text-feed-card-header-date-text">
        <BalanceRemaining
          endAt={game.endAt}
          serverTime={game.serverTime}
          onExpired={onExpired}
          showIcon
        />
      </p>

      {/* 제목블록 → 선택지블록 20, 선택지 사이 4 */}
      <div className="mt-5 flex flex-col gap-1">
        <BalanceOptionButton
          option={game.optionA}
          state={optionState("A")}
          interactive={isInteractive("A")}
          onPress={() => onVote("A")}
        />
        <BalanceOptionButton
          option={game.optionB}
          state={optionState("B")}
          interactive={isInteractive("B")}
          onPress={() => onVote("B")}
        />
      </div>

      {/* 댓글 링크는 우측 정렬 — 카드를 끝맺는 보조 동선이라 시선 흐름의 끝에 둔다. */}
      <div className="mt-2 flex justify-end">
        {/* 피드 카드 리액션 버튼과 같은 규격(높이 28 · 좌우 8 · radius 10 · 간격 4). */}
        <button
          type="button"
          onClick={onPressDetail}
          className="flex h-7 cursor-pointer items-center gap-1 rounded-[10px] px-2 text-text-tertiary"
        >
          <CommentIcon size={16} />
          <span className="text-body-s">
            {/* 댓글이 없으면 "보러 갈 것"이 없다 — 첫 댓글을 유도하는 문구로 바꾼다. */}
            {game.commentCount > 0 ? "댓글 보러가기" : "첫 댓글 남기러 가기"}
          </span>
        </button>
      </div>
    </section>
  );
}
