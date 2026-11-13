"use client";

import { BOARD_PALETTE } from "@/features/community/presentation/balance/balance-board-palette";
import {
  BALANCE_CLOCK_LABEL,
  readBalanceClock,
} from "@/features/community/presentation/balance/balance-countdown";
import { BalanceClock } from "@/features/community/presentation/balance/balance-hero-parts";
import {
  balanceNumeralFont,
  balanceTitleFont,
} from "@/features/community/presentation/balance/balance-board-fonts";
import type { BalanceGame } from "@/features/community/domain/balance-game";
import { cn } from "@/shared/lib/cn";
import { ChevronDownIcon } from "@/shared/ui/icons";

/** 사라질 때 걷히는 시간(ms) — motion.css의 bar-slide-out과 같은 값. 상위가 이만큼 기다렸다 뺀다. */
export const COLLAPSED_BAR_OUT_MS = 180;

/**
 * 히어로가 화면 위로 지나간 뒤 남는 접힌 머리(#305) — 스코어보드를 얇게 썬 먹색 바.
 *
 * 제목 옆에 경기 시계가 남는다. 위계는 제목이 위다 — 펼친 판에서는 시계가 주인공이지만, 접힌 바는
 * "이게 밸런스 게임"이라는 것을 먼저 알리고 시간은 작고 옅게 곁들인다.
 *
 * 바 전체가 버튼 하나다 — 누르면 맨 위로 올라가 판을 다시 펼친다. 오른쪽 ⌄는 "아래로 펼쳐진다"는
 * 단서다. 상세로 바로 가는 길은 펼친 판에 이미 있어서 바에 두 번째 동작을 겹치지 않는다.
 *
 * 만료 통지는 넘기지 않는다 — 펼친 판이 이미 알린다(동시에 마운트돼 있어 둘이 알리면 재조회가 두 번 걸린다).
 */
export function BalanceCollapsedBar({
  game,
  leaving,
  onPress,
}: {
  game: BalanceGame;
  /** 사라지는 중 — 상위가 COLLAPSED_BAR_OUT_MS 뒤에 뺀다. 이 동안은 누를 수 없다. */
  leaving: boolean;
  onPress: () => void;
}) {
  const clock = readBalanceClock(game);

  return (
    // 웹 단독으로 열렸을 때만 상태바 인셋이 잡힌다(네이티브에선 0).
    <div
      className={cn(
        "fixed inset-x-0 top-0 z-20 pt-[env(safe-area-inset-top)]",
        BOARD_PALETTE.bg,
        leaving && "pointer-events-none",
        leaving
          ? "motion-safe:animate-bar-slide-out"
          : "motion-safe:animate-bar-slide-in",
      )}
    >
      <button
        type="button"
        onClick={onPress}
        className={cn(
          "relative isolate flex h-12 w-full cursor-pointer items-center gap-2.5 overflow-hidden px-4 text-left",
          BOARD_PALETTE.text,
          // 눌림은 바 전체가 살짝 옅어진다.
          "motion-safe:transition-opacity motion-safe:duration-120 active:opacity-70",
        )}
      >
        <span
          className={cn(
            balanceTitleFont.className,
            "shrink-0 text-[18px] leading-[22px]",
          )}
        >
          {clock.phase === "result" ? "다음 밸런스 게임까지" : "오늘의 밸런스 게임"}
        </span>
        {/*
          펼친 판과 같은 끝 시각을 센다. 교체 버퍼 동안은 다음 게임까지라 제목도 그 말로 바꾼다(#427) —
          "오늘의 밸런스 게임" 옆에 시간이 있으면 늘 그랬듯 마감까지 남은 시간으로 읽힌다.
        */}
        <BalanceClock
          endAt={clock.until}
          label={BALANCE_CLOCK_LABEL[clock.phase]}
          serverTime={game.serverTime}
          // 제목보다 한 단계 아래 — 작고 옅게.
          className={cn(
            balanceNumeralFont.className,
            "inline-block text-[14px] leading-[18px]",
            BOARD_PALETTE.muted,
          )}
        />
        <ChevronDownIcon
          size={20}
          className={cn("ml-auto shrink-0", BOARD_PALETTE.muted)}
        />
        <span className="sr-only">펼치기</span>
      </button>
    </div>
  );
}
