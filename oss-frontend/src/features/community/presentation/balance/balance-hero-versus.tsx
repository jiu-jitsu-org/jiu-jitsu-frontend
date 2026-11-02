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
 * 히어로 시안 1 · 대각 맞대결(#305).
 *
 * 두 선택지를 행 두 줄이 아니라 **한 판을 대각선으로 가른 두 진영**으로 그린다. 격투 게임 대진 화면처럼
 * 이음매 한가운데 VS가 박히고, 캐릭터는 지금보다 크게 서로를 노려본다(A는 아래, B는 위를 본다 —
 * 그래서 좌우가 아니라 위아래로 가른다).
 *
 * 고르면 줄다리기가 된다 — 고른 진영이 색으로 차오르며 넓어지고, 밀려난 진영은 좁아진다.
 * 넓이는 투표율이 아니다(리스트는 결과를 그리지 않는 정책). 내 선택을 몸으로 보여줄 뿐이다.
 *
 * 이음매는 clip-path다. 누르는 영역도 잘린 모양을 그대로 따라서 이음매 근처에서 탭이 엉뚱한 진영에
 * 가지 않는다. 기울기 24 · 틈 4(B가 20만큼 A 밑으로 파고든다).
 */
const SLANT_CLIP: Record<BalanceOptionKey, string> = {
  A: "[clip-path:polygon(0_0,100%_0,100%_calc(100%-24px),0_100%)]",
  B: "[clip-path:polygon(0_24px,100%_0,100%_100%,0_100%)]",
};

/** 진영 바탕·글자 — 투표 전·밀려남은 옅은 면, 고르면 진한 면에 흰 글자(선택지 행과 같은 토큰). */
const SIDE_STYLES: Record<BalanceOptionKey, Record<"rest" | "picked", string>> = {
  A: {
    rest: "bg-poll-option-a-default-bg text-text-primary",
    picked: "bg-poll-option-a-selected-bg text-poll-option-a-selected-text",
  },
  B: {
    rest: "bg-poll-option-b-default-bg text-text-primary",
    picked: "bg-poll-option-b-selected-bg text-poll-option-b-selected-text",
  },
};

/** 대결 중 기세를 잡은 쪽 면이 진해진다 — 선택지 행의 띠 물들기와 같은 박자. */
const IDLE_TONE: Record<BalanceOptionKey, string> = {
  A: "bg-poll-option-a-selected-bg-track motion-safe:animate-balance-tone-a",
  B: "bg-poll-option-b-selected-bg-track motion-safe:animate-balance-tone-b",
};

/** 줄다리기 — 진영 최소 높이. 고른 쪽이 넓어지고 밀려난 쪽이 좁아진다. */
const SIDE_HEIGHT: Record<BalanceOptionState, string> = {
  default: "min-h-[136px]",
  selected: "min-h-[164px]",
  unselected: "min-h-[112px]",
};

/** 캐릭터 크기(58:66) — 선택지 행보다 한 단계 크다. */
const CHARACTER_SIZE: Record<BalanceOptionState, string> = {
  default: "h-[110px] w-[96px]",
  selected: "h-[128px] w-[112px]",
  unselected: "h-[82px] w-[72px]",
};

export function BalanceHeroVersus({
  game,
  onVote,
  onPressDetail,
  onExpired,
}: BalanceHeroProps) {
  const interactive = !game.closed;

  return (
    <section
      onClick={pressOutsideControls(onPressDetail)}
      className="flex cursor-pointer flex-col gap-4 px-4 pt-6 pb-3"
      aria-label="오늘의 밸런스 게임"
    >
      {/*
        머리는 왼쪽 정렬 — 대각선 판이 이미 움직임을 주므로 머리까지 가운데로 모으면 정적인 포스터가
        된다. 제목과 남은 시간을 한 덩어리로 묶어 판 위에 이름표처럼 얹는다.
      */}
      <header className="flex flex-col items-start gap-2 px-1">
        <h2
          className={cn(
            balanceTitleFont.className,
            "text-[28px] leading-[34px] text-text-primary",
          )}
        >
          오늘의 밸런스 게임
        </h2>
        <p className="text-text-tertiary">
          <BalanceRemaining
            endAt={game.endAt}
            serverTime={game.serverTime}
            onExpired={onExpired}
            showIcon
            labelClassName="text-[13px] leading-4"
          />
        </p>
      </header>

      {/* 판 — 바깥 모서리만 둥글게 자른다. 진영끼리의 경계는 각자의 clip-path가 만든다. */}
      <div className="relative overflow-hidden rounded-[28px]">
        {/*
          A 진영을 감싼 칸이 VS 자리를 잡는다. 칸이 B 위로 겹쳐 그려지므로 칸 자체는 탭을 받지 않고
          (pointer-events-none) 진영 버튼만 받는다 — 그래야 B의 윗변 삼각형이 A 칸에 가려지지 않는다.
        */}
        <div className="pointer-events-none relative z-1">
          <VersusSide
            option={game.optionA}
            state={optionStateOf(game, "A")}
            interactive={interactive}
            onPress={() => onVote("A")}
          />
          <span
            aria-hidden
            className={cn(
              balanceTitleFont.className,
              "absolute bottom-3 left-1/2 flex size-12 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full bg-[var(--bw-true-white)] text-[18px] text-text-primary",
              "shadow-[0_6px_16px_-6px_rgba(15,23,42,0.35)]",
            )}
          >
            VS
          </span>
        </div>
        <div className="-mt-5">
          <VersusSide
            option={game.optionB}
            state={optionStateOf(game, "B")}
            interactive={interactive}
            onPress={() => onVote("B")}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <BalanceHeroCommentLink game={game} onPress={onPressDetail} />
      </div>
    </section>
  );
}

function VersusSide({
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
  const idle = state === "default" && interactive;

  return (
    <button
      type="button"
      aria-pressed={state === "selected"}
      onClick={onPress}
      className={cn(
        "pointer-events-auto relative isolate flex w-full items-center gap-3 pr-6 text-left",
        // A는 아랫변이, B는 윗변이 기운다 — 글이 기운 변에 닿지 않게 그쪽에 24를 더 비운다.
        key === "A" ? "pb-6" : "pt-6",
        SLANT_CLIP[key],
        SIDE_HEIGHT[state],
        state === "selected" ? SIDE_STYLES[key].picked : SIDE_STYLES[key].rest,
        "motion-safe:[transition:min-height_700ms_var(--ease-spring-wobbly),background-color_300ms_ease,color_300ms_ease]",
        interactive && "cursor-pointer",
        // 누름 — 면이 살짝 어두워진다. 판 전체가 하나의 면이라 크기를 줄이면 이음매가 벌어진다.
        "active:brightness-95",
      )}
    >
      {idle ? (
        <span
          aria-hidden
          className={cn("pointer-events-none absolute inset-0 -z-1 opacity-0", IDLE_TONE[key])}
        />
      ) : null}

      {/* 캐릭터는 진영 바닥 왼쪽에 발을 붙인다. A는 아랫변이 왼쪽에서 가장 낮아 거기 선다. */}
      <span
        aria-hidden
        className={cn(
          "ml-3 shrink-0 self-end",
          key === "A" && "-mb-6",
          "motion-safe:transition-[width,height] motion-safe:duration-750 motion-safe:ease-spring-wobbly",
          CHARACTER_SIZE[state],
        )}
      >
        <BalanceCharacter optionKey={key} state={state} interactive={interactive} />
      </span>

      <span
        className={cn(
          "min-w-0 flex-1 text-title-3 break-keep",
          state === "unselected" && "opacity-60",
          "motion-safe:transition-opacity motion-safe:duration-300",
        )}
      >
        {option.text}
      </span>
    </button>
  );
}
