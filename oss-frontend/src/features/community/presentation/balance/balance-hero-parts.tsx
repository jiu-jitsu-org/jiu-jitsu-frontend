"use client";

import type { MouseEvent } from "react";

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
 * 홈 히어로 시안(#305) 셋이 함께 쓰는 조각. 시안이 하나로 정해지면 남는 쪽으로 합친다.
 */

/** 히어로 공통 입력 — BalanceGameCard와 같다. 조회·투표·카운트다운은 상위가 소유한다. */
export type BalanceHeroProps = {
  game: BalanceGame;
  onVote: (option: BalanceOptionKey) => void;
  onPressDetail: () => void;
  /** 잔여 시간이 0에 닿았을 때(다음 판 재조회). 히어로만 넘긴다 — BalanceRemaining 주석 참조. */
  onExpired?: () => void;
};

/** 선택지 표시 상태 — BalanceGameCard와 같은 규칙(투표 전 default · 고른 쪽 selected · 밀려난 쪽 unselected). */
export function optionStateOf(
  game: BalanceGame,
  option: BalanceOptionKey,
): BalanceOptionState {
  if (game.myVote === null) return "default";
  return game.myVote === option ? "selected" : "unselected";
}

/**
 * 버튼·링크 밖을 누르면 상세로 — 카드와 같은 방식(안쪽 버튼이 중첩되지 않게 section에 클릭만 얹는다).
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
}: {
  endAt: string;
  serverTime: string;
  onExpired?: () => void;
  className?: string;
}) {
  const { remainMs } = useBalanceCountdown({ endAt, serverTime, onExpired });
  if (remainMs === null) return null;

  return (
    // 매초 바뀌어 aria-live를 두지 않는다. 읽을 때는 "남은 시간 11:54:36"으로 읽힌다.
    <span className={cn("tabular-nums", className)} aria-label={`남은 시간 ${toClock(remainMs)}`}>
      <span aria-hidden>
        <RollingText text={toClock(remainMs)} />
      </span>
    </span>
  );
}

/**
 * 댓글 링크 — 카드의 것과 같은 규격(리액션 버튼 높이 32 · 아이콘 20 · 누르는 영역 44).
 * 어두운 바탕(스코어보드) 위에서는 흰 글자로 바뀐다.
 */
export function BalanceHeroCommentLink({
  game,
  onPress,
  onDark = false,
}: {
  game: BalanceGame;
  onPress: () => void;
  onDark?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-pressed={game.commented}
      className={cn(
        "group flex h-8 cursor-pointer items-center gap-1 rounded-[10px] px-2",
        REACTION_HIT_AREA,
        onDark
          ? "text-[var(--opacity-white-80)] active:bg-[var(--opacity-white-20)]"
          : [
              game.commented
                ? "text-reaction-bar-active-comment-icon"
                : "text-text-tertiary",
              "active:bg-reaction-bar-pressed-bg active:text-reaction-bar-pressed-icon",
            ],
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
