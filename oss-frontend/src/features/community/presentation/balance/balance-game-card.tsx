"use client";

import type { MouseEvent } from "react";

import {
  BalanceOptionButton,
  type BalanceOptionState,
} from "@/features/community/presentation/balance/balance-option-button";
import { BalanceRemaining } from "@/features/community/presentation/balance/balance-remaining";
import { balanceTitleFont } from "@/features/community/presentation/balance/balance-title-font";
import { useClashOnView } from "@/features/community/presentation/balance/use-clash-on-view";
import { REACTION_PRESS_MOTION } from "@/features/community/presentation/comment-reaction-styles";
import type {
  BalanceGame,
  BalanceOptionKey,
} from "@/features/community/domain/balance-game";
import { cn } from "@/shared/lib/cn";
import { CommentIcon } from "@/shared/ui/icons";

/**
 * 맨 위 바탕 세 겹 — 투표 전(both)과 고른 쪽(A/B). 겹의 투명도만 바꿔 색이 스르륵 넘어가게 한다
 * (그라데이션은 배경색처럼 transition되지 않는다).
 */
const HERO_WASHES = [
  {
    key: "both",
    className:
      "bg-linear-to-r from-poll-option-a-selected-bg-track to-poll-option-b-selected-bg-track",
  },
  {
    key: "A",
    className: "bg-poll-option-a-selected-bg-track",
  },
  {
    key: "B",
    className: "bg-poll-option-b-selected-bg-track",
  },
] as const;

/**
 * 밸런스 게임 풀 카드 — 피드 최상단에 고정 노출된다.
 *
 * 순수 뷰다. 조회·투표·카운트다운은 모두 상위(BalanceGameSection)가 소유하고, 이 컴포넌트는
 * 받은 값을 그리고 탭을 콜백으로 위임한다. 스스로 갖는 것은 "지금 한 판 맞붙는 중인가"라는 보기 상태뿐이다
 * (useClashOnView — 화면에 들어올 때마다 한 판, 나머지는 쉼).
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
   * 눌러서 상태가 바뀔 수 있는지 — 커서 표현에만 쓴다.
   *
   * 마감 전에는 어느 선택지든 바뀐다(미참여 → 투표, 고른 것 → 취소, 다른 것 → 변경).
   * 마감된 판은 눌러도 투표되지 않고 투표 훅이 안내 토스트만 띄운다.
   */
  const interactive = !game.closed;

  // 볼 때마다 한 판 — 투표 전에는 대결, 고른 뒤에는 이긴 쪽이 으스대는 한 판. 마감된 판은 쉰다.
  const { targetRef, clashing } = useClashOnView<HTMLElement>({
    enabled: interactive,
    phase: game.myVote ?? "none",
  });

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
      ref={targetRef}
      onClick={handleCardPress}
      // 배경을 두지 않는다 — 피드 배경이 그대로 비쳐야 한다(디자인). 좌우 16만 준다.
      // 눌림은 피드 카드(FeedCard)와 같다 — 바탕이 옅게 깔리며 98%로 눌렸다가 놓으면 스프링으로 돌아온다.
      // 안쪽 버튼(선택지·댓글 링크)을 누를 때는 카드가 반응하지 않게 not-has로 뺀다.
      className={cn(
        "relative flex cursor-pointer flex-col px-4",
        "active:not-has-[:is(button,a):active]:bg-surface-container-pressed",
        "motion-safe:[transition:scale_500ms_var(--ease-spring-wobbly),background-color_120ms_ease-out]",
        "motion-safe:active:[transition:scale_100ms_ease-out,background-color_120ms_ease-out]",
        "motion-safe:active:not-has-[:is(button,a):active]:scale-[0.98]",
      )}
      aria-label="오늘의 밸런스 게임"
    >
      {/*
        맨 위 바탕 — 위에서 아래로 배경색에 녹아드는 옅은 물들임. 평소에는 왼쪽 빨강·오른쪽 파랑이 함께
        깔려 움직이지 않고, 고르면 고른 색 한 겹으로 바뀐다(500ms). 색은 "내가 골랐다"는 뜻이 생길 때만
        움직인다. 카드 위 여백(감싸는 칸의 pt-6)까지 덮어야 화면 맨 위부터 물든다.
      */}
      <span
        aria-hidden
        // 아래로 녹아드는 것은 겹의 색이 아니라 이 가림막(mask)이 한다 — 끝이 실제 피드 배경과 맞는다.
        className="pointer-events-none absolute inset-x-0 -top-6 h-55 [mask-image:linear-gradient(to_bottom,black,rgb(0_0_0/0.45)_45%,transparent)]"
      >
        {HERO_WASHES.map(({ key, className }) => (
          <span
            key={key}
            className={cn(
              "absolute inset-0 motion-safe:transition-opacity motion-safe:duration-500 motion-safe:ease-smooth-out",
              className,
              (game.myVote ?? "both") === key ? "opacity-100" : "opacity-0",
            )}
          />
        ))}
      </span>

      {/* 제목·타이머는 가운데 정렬 — 카드 안에서 선택지 묶음보다 상위 정보라는 것을 위계로 드러낸다. */}
      <h2
        className={cn(
          balanceTitleFont.className,
          "relative text-center text-[30px] leading-10 tracking-[-0.01em] text-feed-card-body-title-text",
        )}
      >
        오늘의 밸런스 게임
      </h2>

      {/* 매초 바뀌는 문구는 BalanceRemaining 안에 갇혀 있다 — 카드는 초마다 리렌더되지 않는다. */}
      <p className="relative mt-2 text-center text-feed-card-header-date-text">
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
          interactive={interactive}
          clash={clashing ? "once" : "rest"}
          onPress={() => onVote("A")}
        />
        <BalanceOptionButton
          option={game.optionB}
          state={optionState("B")}
          interactive={interactive}
          clash={clashing ? "once" : "rest"}
          onPress={() => onVote("B")}
        />
      </div>

      {/* 댓글 링크는 우측 정렬 — 카드를 끝맺는 보조 동선이라 시선 흐름의 끝에 둔다. */}
      <div className="mt-2 flex justify-end">
        {/*
          피드 카드 리액션 버튼과 같은 규격(높이 28 · 좌우 8 · radius 10 · 간격 4).

          Active(내가 댓글을 남김) 표시는 게시글 피드 카드(FeedCardReactions)와 **같은 규칙**이다
          — 아이콘이 filled로 바뀌고 reaction-bar/active 토큰으로 올라간다. 토글이 아니라 표시
          전용이라는 것도 같다.

          다만 Default는 게시글 카드와 다르다. 그쪽은 카운트 숫자를 붙이는 리액션 버튼이라
          아이콘이 reaction-bar/default/icon(더 연한 색)이지만, 이 버튼은 숫자 대신 문구를 다는
          링크에 가까워 아이콘과 문구가 같은 색이어야 한 덩어리로 읽힌다.
        */}
        <button
          type="button"
          onClick={onPressDetail}
          aria-pressed={game.commented}
          className={cn(
            "group flex h-7 cursor-pointer items-center gap-1 rounded-[10px] px-2",
            game.commented
              ? "text-reaction-bar-active-comment-icon"
              : "text-text-tertiary",
            // 눌림은 댓글 반응 버튼과 같다 — reaction-bar 눌림 면·색에, 눌렸다 튀어 돌아오는 스프링.
            "active:bg-reaction-bar-pressed-bg active:text-reaction-bar-pressed-icon",
            REACTION_PRESS_MOTION,
          )}
        >
          <CommentIcon size={16} filled={game.commented} />
          <span
            className={cn(
              "text-body-s",
              game.commented && "text-reaction-bar-active-count-text",
              "group-active:text-reaction-bar-pressed-count-text",
            )}
          >
            {/* 댓글이 없으면 "보러 갈 것"이 없다 — 첫 댓글을 유도하는 문구로 바꾼다. */}
            {game.commentCount > 0 ? "댓글 보러가기" : "첫 댓글 남기러 가기"}
          </span>
        </button>
      </div>
    </section>
  );
}
