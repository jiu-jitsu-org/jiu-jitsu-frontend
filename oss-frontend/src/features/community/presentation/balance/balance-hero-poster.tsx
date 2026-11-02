"use client";

import { BalanceCharacter } from "@/features/community/presentation/balance/balance-character";
import {
  type BalanceHeroProps,
  BalanceHeroCommentLink,
  optionStateOf,
  pressOutsideControls,
} from "@/features/community/presentation/balance/balance-hero-parts";
import type { BalanceOptionState } from "@/features/community/presentation/balance/balance-option-button";
import { BalanceRemaining } from "@/features/community/presentation/balance/balance-remaining";
import { balanceTitleFont } from "@/features/community/presentation/balance/balance-title-font";
import type {
  BalanceGameOption,
  BalanceOptionKey,
} from "@/features/community/domain/balance-game";
import { cn } from "@/shared/lib/cn";

/**
 * 히어로 시안 2 · 질문 포스터(#305).
 *
 * 질문 자체가 간판이다 — "오늘의 밸런스 게임"은 작은 이름표로 물러나고, 두 선택지 문구가 30px 굵은
 * 헤드라인으로 화면을 연다. 색 면 대신 타이포가 위계를 만들고, 색은 A/B 표지와 모서리의 옅은 번짐
 * 두 군데에만 쓴다. 캐릭터는 오른쪽 가장자리에서 고개를 내민다(화면 밖으로 살짝 잘린다).
 *
 * 고르면 고른 문구에 형광펜이 그어지고(그 색의 진한 띠가 글자 아래 절반에), 밀려난 문구는 흐려진다.
 */

/** 형광펜 — 글자 아래 45%에 깔린다. 줄이 바뀌어도 줄마다 그어지도록 inline 요소에 box-decoration을 준다. */
const HIGHLIGHT: Record<BalanceOptionKey, string> = {
  A: "bg-[linear-gradient(transparent_55%,var(--surface-poll-a-track)_55%)]",
  B: "bg-[linear-gradient(transparent_55%,var(--surface-poll-b-track)_55%)]",
};

/** A/B 표지 색. */
const MARK: Record<BalanceOptionKey, string> = {
  A: "text-interactive-poll-a",
  B: "text-interactive-poll-b",
};

/** 캐릭터 크기(58:66). 고른 쪽이 커지고 밀려난 쪽이 작아진다. */
const CHARACTER_SIZE: Record<BalanceOptionState, string> = {
  default: "h-[91px] w-[80px]",
  selected: "h-[110px] w-[96px]",
  unselected: "h-[73px] w-[64px]",
};

export function BalanceHeroPoster({
  game,
  onVote,
  onPressDetail,
  onExpired,
}: BalanceHeroProps) {
  const interactive = !game.closed;

  return (
    <section
      onClick={pressOutsideControls(onPressDetail)}
      // 번짐: 왼쪽 위 빨강(A 쪽), 오른쪽 가운데 파랑(B 쪽) — 진영의 방향만 암시하는 옅은 빛. 면 전체를
      // 물들이지 않는다(2026 흐름도 꽉 찬 그라데이션 히어로에서 물러나는 쪽이다). 파랑을 바닥이 아니라
      // 가운데에 두는 이유: 바닥에 두면 히어로가 끝나는 선에서 빛이 잘려 경계가 보인다.
      className={cn(
        "relative flex cursor-pointer flex-col overflow-hidden px-5 pt-6 pb-3",
        "bg-[radial-gradient(120%_70%_at_0%_0%,color-mix(in_srgb,var(--surface-poll-a-track)_55%,transparent),transparent_60%),radial-gradient(90%_45%_at_100%_68%,color-mix(in_srgb,var(--surface-poll-b-track)_55%,transparent),transparent_70%)]",
      )}
      aria-label="오늘의 밸런스 게임"
    >
      {/* 이름표 줄 — 제목은 작게, 남은 시간은 오른쪽 끝. 둘 다 한 줄로 끝나는 짧은 문구다. */}
      <header className="flex items-center justify-between gap-3">
        <h2
          className={cn(
            balanceTitleFont.className,
            "text-[18px] leading-[22px] text-text-primary",
          )}
        >
          오늘의 밸런스 게임
        </h2>
        <span className="shrink-0 text-text-tertiary">
          <BalanceRemaining
            endAt={game.endAt}
            serverTime={game.serverTime}
            onExpired={onExpired}
            showIcon
          />
        </span>
      </header>

      <div className="mt-5 flex flex-col">
        <PosterLine
          option={game.optionA}
          state={optionStateOf(game, "A")}
          interactive={interactive}
          onPress={() => onVote("A")}
        />

        {/* 가운데 vs — 가는 선 사이에 박아 두 질문을 갈라놓는다. */}
        <div aria-hidden className="my-1 flex items-center gap-3 pr-24">
          <span className="h-px flex-1 bg-border-default" />
          <span
            className={cn(
              balanceTitleFont.className,
              "text-[20px] leading-6 text-text-tertiary",
            )}
          >
            vs
          </span>
          <span className="h-px flex-1 bg-border-default" />
        </div>

        <PosterLine
          option={game.optionB}
          state={optionStateOf(game, "B")}
          interactive={interactive}
          onPress={() => onVote("B")}
        />
      </div>

      <div className="mt-1 flex justify-end">
        <BalanceHeroCommentLink game={game} onPress={onPressDetail} />
      </div>
    </section>
  );
}

function PosterLine({
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

  return (
    <button
      type="button"
      aria-pressed={state === "selected"}
      onClick={onPress}
      className={cn(
        // 오른쪽은 캐릭터가 서는 자리(최대 96)만큼 비운다 — 헤드라인이 캐릭터 밑으로 들어가지 않게.
        "relative -mx-5 flex min-h-[96px] items-center py-3 pr-[108px] pl-5 text-left",
        interactive && "cursor-pointer",
        // 누름 — 헤드라인이 살짝 눌렸다 스프링으로 돌아온다.
        "motion-safe:[transition:scale_500ms_var(--ease-spring-wobbly)] motion-safe:active:scale-[0.98] motion-safe:active:[transition:scale_100ms_ease-out]",
      )}
    >
      {/* A/B 표지는 헤드라인 첫 줄과 글자 바닥선을 맞춘다. */}
      <span className="flex min-w-0 flex-1 items-baseline gap-3">
        <span
          className={cn(
            balanceTitleFont.className,
            "w-5 shrink-0 text-[24px] leading-[38px]",
            MARK[key],
          )}
          aria-hidden
        >
          {key}
        </span>

        <span
          className={cn(
            "min-w-0 flex-1 text-[28px] leading-[38px] font-bold tracking-[-0.6px] break-keep text-text-primary",
            "motion-safe:transition-opacity motion-safe:duration-300",
            state === "unselected" && "opacity-35",
          )}
        >
          <span
            className={cn(
              "[box-decoration-break:clone] bg-no-repeat",
              "motion-safe:[transition:background-size_500ms_var(--ease-smooth-out)]",
              HIGHLIGHT[key],
              state === "selected"
                ? "bg-[length:100%_100%]"
                : "bg-[length:0%_100%]",
            )}
          >
            {option.text}
          </span>
        </span>
      </span>

      {/*
        캐릭터는 오른쪽 가장자리에 붙어 몸 일부가 화면 밖으로 잘린다 — 문구를 엿보는 자세.
        아래쪽은 줄 바닥에 발을 붙인다.
      */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute right-2 bottom-0 [clip-path:inset(-50%_-50%_0_-50%)]",
          "motion-safe:transition-[width,height] motion-safe:duration-750 motion-safe:ease-spring-wobbly",
          CHARACTER_SIZE[state],
        )}
      >
        <BalanceCharacter optionKey={key} state={state} interactive={interactive} />
      </span>
    </button>
  );
}
