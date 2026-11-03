"use client";

import type { MouseEvent, ReactNode } from "react";

import type { BalanceOptionState } from "@/features/community/presentation/balance/balance-option-button";
import { RollingText } from "@/features/community/presentation/balance/rolling-text";
import { useBalanceCountdown } from "@/features/community/presentation/balance/use-balance-countdown";
import {
  REACTION_HIT_AREA,
  REACTION_ICON_SIZE,
  REACTION_PRESS_MOTION,
} from "@/features/community/presentation/comment-reaction-styles";
import type {
  BalanceGame,
  BalanceOptionKey,
} from "@/features/community/domain/balance-game";
import { cn } from "@/shared/lib/cn";
import { CommentIcon } from "@/shared/ui/icons";

/*
 * 스코어보드(#305) 조각 — 홈 히어로·상세 판(BalanceHeroBoard)과 접힌 바(BalanceCollapsedBar)가 함께 쓴다.
 */

/** 스코어보드 입력. 조회·투표·카운트다운은 상위가 소유한다. */
export type BalanceHeroProps = {
  game: BalanceGame;
  onVote: (option: BalanceOptionKey) => void;
  onPressDetail: () => void;
  /** 잔여 시간이 0에 닿았을 때(다음 판 재조회). 히어로만 넘긴다 — BalanceRemaining 주석 참조. */
  onExpired?: () => void;
  /** 그날 게임을 처음 볼 때 한 번 도는 등장 동작(#305). 아니면 바로 그린다. */
  intro?: boolean;
};


/** 선택지 표시 상태 — 선택지 행과 같은 규칙(투표 전 default · 고른 쪽 selected · 밀려난 쪽 unselected). */
export function optionStateOf(
  game: BalanceGame,
  option: BalanceOptionKey,
): BalanceOptionState {
  if (game.myVote === null) return "default";
  return game.myVote === option ? "selected" : "unselected";
}

/**
 * 버튼·링크 밖을 누르면 상세로 — 안쪽 버튼이 중첩되지 않게 section에 클릭만 얹는다.
 */
export function pressOutsideControls(onPressDetail: () => void) {
  return (event: MouseEvent<HTMLElement>) => {
    if (event.target instanceof Element && event.target.closest("button, a")) {
      return;
    }
    onPressDetail();
  };
}

/** 남은 시간을 시계 자리(11:54:36)로. 시간이 두 자리를 넘어도(100시간) 그대로 늘어난다. */
function toClock(remainMs: number): string {
  const total = Math.floor(remainMs / 1000);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

/**
 * 경기 시계 — 남은 시간을 매트 위 타이머처럼 숫자만으로 보여준다. 숫자는 자리마다 굴러간다.
 *
 * 매초 리렌더되는 말단이다(BalanceRemaining과 같은 이유). 파싱할 수 없으면 아무것도 그리지 않는다.
 */
export function BalanceClock({
  endAt,
  serverTime,
  onExpired,
  className,
  below,
}: {
  endAt: string;
  serverTime: string;
  onExpired?: () => void;
  className?: string;
  /**
   * 시계 바로 아래에 붙일 것 — 같은 틱(remainMs)을 받는다. 남은 시간 이름표의 째깍 아이콘이 숫자와 같은
   * 순간에 움직이게, 카운트다운을 따로 구독하지 않고 여기서 함께 그린다(타이머가 둘이면 박자가 어긋난다).
   */
  below?: (remainMs: number) => ReactNode;
}) {
  const { remainMs } = useBalanceCountdown({ endAt, serverTime, onExpired });
  if (remainMs === null) return null;

  return (
    <>
      {/*
        매초 바뀌어 aria-live를 두지 않는다(role="timer"는 기본이 off). 굴러가는 숫자는 낭독기에서 숨기고,
        읽을 때는 "남은 시간 11:54:36" 한 덩어리로 읽힌다 — aria-label은 일반 span에서 무시되므로 숨은 글자로 둔다.
      */}
      <span role="timer" className={cn("tabular-nums", className)}>
        <span aria-hidden>
          <RollingText text={toClock(remainMs)} />
        </span>
        <span className="sr-only">남은 시간 {toClock(remainMs)}</span>
      </span>
      {below?.(remainMs)}
    </>
  );
}

/**
 * 댓글 링크 — 리액션 버튼과 같은 규격(높이 32 · 아이콘 20 · 누르는 영역 44). 먹색 판 위라 흰 글자다.
 */
export function BalanceHeroCommentLink({
  game,
  onPress,
}: {
  game: BalanceGame;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-pressed={game.commented}
      className={cn(
        "group flex h-8 cursor-pointer items-center gap-1 rounded-[10px] px-2",
        REACTION_HIT_AREA,
        "text-[var(--opacity-white-80)] active:bg-[var(--opacity-white-20)]",
        REACTION_PRESS_MOTION,
      )}
    >
      <CommentIcon size={REACTION_ICON_SIZE} filled={game.commented} />
      <span className="text-body-s">
        {game.commentCount > 0
          ? `댓글 ${game.commentCount}개 보러가기`
          : "첫 댓글 남기러 가기"}
      </span>
    </button>
  );
}
