"use client";

import { BalanceCharacter } from "@/features/community/presentation/balance/balance-character";
import {
  type BalanceHeroProps,
  BalanceClock,
  BalanceHeroCommentLink,
  optionStateOf,
  pressOutsideControls,
} from "@/features/community/presentation/balance/balance-hero-parts";
import type { BalanceOptionState } from "@/features/community/presentation/balance/balance-option-button";
import { balanceTitleFont } from "@/features/community/presentation/balance/balance-title-font";
import type {
  BalanceGameOption,
  BalanceOptionKey,
} from "@/features/community/domain/balance-game";
import { cn } from "@/shared/lib/cn";
import { CheckIcon } from "@/shared/ui/icons";

/**
 * 히어로 시안 3 · 매트 스코어보드(#305).
 *
 * 주짓수 대회 매트 옆 전광판을 옮겨 온다 — 짙은 남색 판, 한가운데 큰 경기 시계, 그 아래 홍·청 선수
 * 두 줄. 이 앱 사용자에게 가장 익숙한 "대결" 화면이라 설명 없이 읽힌다. 남은 시간이 주인공이 되어
 * "오늘 안에 골라야 한다"는 긴장이 생긴다.
 *
 * 선수 줄은 실제 전광판처럼 왼쪽에 진영 색 블록(캐릭터가 선다), 가운데 이름(선택지), 오른쪽에 점수
 * 자리가 있다. 점수 자리에는 숫자 대신 A/B를 두고, 고르면 체크로 바뀐다 — 리스트는 투표율을 그리지
 * 않는 정책이라 점수판에 숫자를 지어내지 않는다.
 *
 * 판은 아래 모서리만 둥글게 끝나 피드와 갈린다. 어두운 면은 이 판 하나뿐이다(앱에 다크 모드는 없다).
 */

/** 진영 색 블록 — 전광판의 홍·청. */
const CORNER: Record<BalanceOptionKey, string> = {
  A: "bg-poll-option-a-selected-bg",
  B: "bg-poll-option-b-selected-bg",
};

/** 캐릭터 크기(58:66). 블록 안에 서므로 행보다 크게 키우지 않는다. */
const CHARACTER_SIZE: Record<BalanceOptionState, string> = {
  default: "h-[66px] w-[58px]",
  selected: "h-[73px] w-[64px]",
  unselected: "h-[55px] w-[48px]",
};

export function BalanceHeroBoard({
  game,
  onVote,
  onPressDetail,
  onExpired,
}: BalanceHeroProps) {
  const interactive = !game.closed;

  return (
    <section
      onClick={pressOutsideControls(onPressDetail)}
      // 남색은 시맨틱 토큰이 없어 원시값을 쓴다(page.tsx와 같은 방식). 위쪽에 아주 옅은 빛을 둬 판이
      // 평평한 검정 사각형으로 죽지 않게 한다.
      className={cn(
        "relative flex cursor-pointer flex-col overflow-hidden rounded-b-[28px] px-4 pt-5 pb-3 text-text-on-dark",
        "bg-[var(--blue-1000)] bg-[radial-gradient(90%_60%_at_50%_0%,color-mix(in_srgb,var(--blue-500p)_28%,transparent),transparent_70%)]",
      )}
      aria-label="오늘의 밸런스 게임"
    >
      <header className="flex items-center justify-between px-1">
        <h2 className={cn(balanceTitleFont.className, "text-[20px] leading-6")}>
          오늘의 밸런스 게임
        </h2>
        {/* 경기 중 표시 — 마감되면 "종료"로. 점은 숨 쉬듯 깜빡인다(동작 줄이기면 멈춘다). */}
        <span className="flex items-center gap-1.5 text-label-m text-[var(--opacity-white-80)]">
          <span
            aria-hidden
            className={cn(
              "size-2 rounded-full",
              game.closed
                ? "bg-[var(--opacity-white-40)]"
                : "bg-interactive-poll-a motion-safe:animate-pulse",
            )}
          />
          {game.closed ? "종료" : "진행 중"}
        </span>
      </header>

      {/* 경기 시계 — 판의 주인공. 숫자가 자리마다 굴러간다. */}
      <div className="mt-4 flex flex-col items-center">
        <BalanceClock
          endAt={game.endAt}
          serverTime={game.serverTime}
          onExpired={onExpired}
          className="text-[56px] leading-[60px] font-bold tracking-[-1.5px]"
        />
        <span className="mt-1 text-label-m tracking-[2px] text-[var(--opacity-white-60)]">
          남은 시간
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <BoardRow
          option={game.optionA}
          state={optionStateOf(game, "A")}
          interactive={interactive}
          onPress={() => onVote("A")}
        />
        <BoardRow
          option={game.optionB}
          state={optionStateOf(game, "B")}
          interactive={interactive}
          onPress={() => onVote("B")}
        />
      </div>

      <div className="mt-2 flex justify-end">
        <BalanceHeroCommentLink game={game} onPress={onPressDetail} onDark />
      </div>
    </section>
  );
}

function BoardRow({
  option,
  state,
  interactive,
  onPress,
}: {
  option: BalanceGameOption;
  state: BalanceOptionState;
  interactive: boolean;
  onPress: () => void;
}) {
  const key = option.key;
  const selected = state === "selected";

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onPress}
      className={cn(
        "flex min-h-[76px] w-full items-stretch overflow-hidden rounded-2xl text-left",
        // 고른 줄은 진영 색으로 통째로 켜지고, 밀려난 줄은 꺼진다(전광판에서 승자 줄이 켜지듯).
        // 꺼진 줄은 흰 10% — 남색 위에 회색 판처럼 탁해지지 않는 가장 옅은 면.
        selected
          ? CORNER[key]
          : "bg-[color-mix(in_srgb,var(--bw-white)_10%,transparent)]",
        state === "unselected" && "opacity-50",
        "motion-safe:[transition:background-color_300ms_ease,opacity_300ms_ease,scale_500ms_var(--ease-spring-wobbly)]",
        "motion-safe:active:scale-[0.98] motion-safe:active:[transition:scale_100ms_ease-out]",
        interactive && "cursor-pointer",
      )}
    >
      {/* 진영 블록 — 캐릭터가 바닥에 발을 붙이고 선다. */}
      <span
        aria-hidden
        className={cn("flex w-[76px] shrink-0 items-end justify-center", CORNER[key])}
      >
        <span
          className={cn(
            "motion-safe:transition-[width,height] motion-safe:duration-750 motion-safe:ease-spring-wobbly",
            CHARACTER_SIZE[state],
          )}
        >
          <BalanceCharacter optionKey={key} state={state} interactive={interactive} />
        </span>
      </span>

      <span className="flex min-w-0 flex-1 items-center px-4 py-3 text-title-3 break-keep">
        {option.text}
      </span>

      {/* 점수 자리 — 숫자 대신 진영 글자. 고르면 체크로 바뀐다. */}
      <span
        aria-hidden
        className="flex w-14 shrink-0 items-center justify-center border-l border-[var(--opacity-white-20)]"
      >
        {selected ? (
          <CheckIcon size={24} />
        ) : (
          <span
            className={cn(
              balanceTitleFont.className,
              "text-[24px] text-[var(--opacity-white-60)]",
            )}
          >
            {key}
          </span>
        )}
      </span>
    </button>
  );
}
