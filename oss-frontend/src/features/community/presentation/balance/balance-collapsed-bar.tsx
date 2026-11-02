"use client";

import { BalanceSheetHandle } from "@/features/community/presentation/balance/balance-feed-frame";
import { BalanceHeroWash } from "@/features/community/presentation/balance/balance-hero-wash";
import { BalanceRemaining } from "@/features/community/presentation/balance/balance-remaining";
import { balanceTitleFont } from "@/features/community/presentation/balance/balance-title-font";
import type { BalanceGame } from "@/features/community/domain/balance-game";
import { cn } from "@/shared/lib/cn";
import { ChevronDownIcon } from "@/shared/ui/icons";

/** 사라질 때 걷히는 시간(ms) — motion.css의 bar-slide-out · fade-out과 같은 값. 상위가 이만큼 기다렸다 뺀다. */
export const COLLAPSED_BAR_OUT_MS = 180;

const TITLE = "오늘의 밸런스 게임";

/**
 * 히어로가 화면 위로 지나간 뒤 남는 접힌 게임 머리(#305).
 *
 * - sheet (2-A): 피드 시트의 머리가 된다. 시트 윗변이 화면 맨 위에 닿는 순간 나타나 손잡이 위치가
 *   시트의 손잡이와 겹친다 — 움직여 들어오지 않고 제자리에서 옅게 떠올라야 시트가 "머리를 얻은"
 *   것처럼 읽힌다.
 * - bar (2-B): 히어로를 얇게 썰어 남긴 바. 히어로와 같은 물들임(대결 중이면 두 색이 오가고, 고르면
 *   고른 색)을 깔아 같은 것이 접혔다는 것을 색으로 잇는다. 위에서 곧게 미끄러져 내려온다.
 *
 * 어느 쪽이든 바 전체가 버튼 하나다 — 누르면 맨 위로 올라가 게임을 다시 펼친다. 오른쪽 ⌄는
 * "아래로 펼쳐진다"는 단서다. 상세로 바로 가는 길은 펼친 게임(카드·댓글 링크)에 이미 있어서
 * 바에 두 번째 동작을 겹치지 않는다 — 한 줄짜리 바에 누를 곳이 둘이면 손가락이 갈 곳을 고민한다.
 *
 * 남은 시간은 매초 바뀌지만 BalanceRemaining 안에 갇혀 바는 리렌더되지 않는다. 만료 통지는
 * 넘기지 않는다 — 펼친 카드가 이미 알린다(BalanceRemaining 주석 참조).
 */
export function BalanceCollapsedBar({
  kind,
  game,
  leaving,
  onPress,
}: {
  kind: "sheet" | "bar";
  game: BalanceGame;
  /** 사라지는 중 — 상위가 COLLAPSED_BAR_OUT_MS 뒤에 뺀다. 이 동안은 누를 수 없다. */
  leaving: boolean;
  onPress: () => void;
}) {
  const remaining = (
    <BalanceRemaining
      endAt={game.endAt}
      serverTime={game.serverTime}
      showIcon
      className="text-feed-card-header-date-text"
    />
  );

  return (
    // 웹 단독으로 열렸을 때만 상태바 인셋이 잡힌다(네이티브에선 0) — sticky 바와 같다.
    <div
      className={cn(
        "fixed inset-x-0 top-0 z-20 bg-[var(--bw-white)] pt-[env(safe-area-inset-top)]",
        leaving && "pointer-events-none",
        kind === "sheet"
          ? leaving
            ? "motion-safe:animate-fade-out"
            : "motion-safe:animate-fade-in"
          : leaving
            ? "motion-safe:animate-bar-slide-out"
            : "motion-safe:animate-bar-slide-in",
      )}
    >
      <button
        type="button"
        onClick={onPress}
        className={cn(
          "relative isolate flex w-full cursor-pointer overflow-hidden border-b border-border-subtle px-4 text-left",
          // 눌림은 바 전체가 살짝 옅어진다 — 물들임이 바탕을 덮어 바탕색으로는 눌림이 안 보인다.
          "motion-safe:transition-opacity motion-safe:duration-120 active:opacity-70",
          kind === "sheet"
            ? "flex-col pt-2 pb-3 shadow-[0_8px_16px_-14px_rgba(15,23,42,0.3)]"
            : "h-12 items-center gap-2",
        )}
      >
        {kind === "sheet" ? (
          <>
            <BalanceSheetHandle />
            {/* 제목·남은 시간을 위아래로 묶어 왼쪽에, ⌄는 오른쪽 끝 가운데에. */}
            <span className="mt-3 flex w-full items-center gap-3">
              <span className="flex min-w-0 flex-col items-start gap-1.5">
                <span
                  className={cn(
                    balanceTitleFont.className,
                    "text-[20px] leading-6 text-feed-card-body-title-text",
                  )}
                >
                  {TITLE}
                </span>
                <span className="inline-flex h-6 items-center rounded-full bg-balance-game-countdown-badge-bg px-2">
                  {remaining}
                </span>
              </span>
              <ChevronDownIcon
                size={24}
                className="ml-auto shrink-0 text-icon-secondary"
              />
            </span>
          </>
        ) : (
          <>
            <BalanceHeroWash
              myVote={game.myVote}
              idle={game.myVote === null && !game.closed}
              fade="none"
              base
              className="inset-y-0"
            />
            <span
              className={cn(
                balanceTitleFont.className,
                "shrink-0 text-[18px] leading-[22px] text-feed-card-body-title-text",
              )}
            >
              {TITLE}
            </span>
            <span className="min-w-0 truncate">{remaining}</span>
            <ChevronDownIcon
              size={20}
              className="ml-auto shrink-0 text-icon-secondary"
            />
          </>
        )}
        <span className="sr-only">펼치기</span>
      </button>
    </div>
  );
}
