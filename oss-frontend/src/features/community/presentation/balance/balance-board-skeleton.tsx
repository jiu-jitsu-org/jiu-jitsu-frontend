import type { CSSProperties } from "react";

import { BOARD_PALETTE } from "@/features/community/presentation/balance/balance-board-palette";
import { cn } from "@/shared/lib/cn";

/** 판 위 덩어리 — 꺼진 선수 줄과 같은 옅은 면(BOARD_PALETTE.row). */
const BLOCK = BOARD_PALETTE.row;

/**
 * 스코어보드 판 로딩 뼈대(#305) — 홈(loading.tsx)과 상세(DetailSkeleton)가 쓴다.
 *
 * 실제 판(BalanceHeroBoard)과 같은 먹색 면·같은 간격으로 잡는다. 밝은 회색 뼈대에서 먹색 판으로 바뀌면
 * 화면 맨 위가 번쩍인다. 문구 한 줄 기준 높이 — 홈 406 · 상세 374(댓글 링크 없음, 아래 여백 20).
 * 깜빡임은 동작 줄이기면 멈춘다.
 */
export function BalanceBoardSkeleton({
  variant,
  style,
}: {
  variant: "hero" | "detail";
  style?: CSSProperties;
}) {
  const detail = variant === "detail";

  return (
    <div
      aria-hidden
      style={style}
      className={cn(
        "flex flex-col px-4 pt-5 motion-safe:animate-pulse",
        BOARD_PALETTE.bg,
        detail ? "rounded-[24px] pb-5" : "rounded-b-[28px] pb-3",
      )}
    >
      {/* 제목 · 진행 중(28) */}
      <div className="flex h-7 items-center justify-between px-1">
        <div className={cn("h-5 w-40 rounded", BLOCK)} />
        <div className={cn("h-3 w-12 rounded", BLOCK)} />
      </div>
      {/* 경기 시계(64) · 남은 시간 알약(24) — 위 16 */}
      <div className="mt-4 flex h-[94px] flex-col items-center">
        <div className={cn("h-14 w-56 rounded-lg", BLOCK)} />
        <div className={cn("mt-2.5 h-6 w-24 rounded-full", BLOCK)} />
      </div>
      {/* 선수 줄 76 × 2(간격 20) — 위 24 */}
      <div className="mt-6 flex flex-col gap-5">
        <div className={cn("h-[76px] rounded-2xl", BLOCK)} />
        <div className={cn("h-[76px] rounded-2xl", BLOCK)} />
      </div>
      {/* 댓글 링크(32) — 홈만 */}
      {detail ? null : (
        <div className="mt-2 flex justify-end">
          <div className={cn("h-8 w-28 rounded-[10px]", BLOCK)} />
        </div>
      )}
    </div>
  );
}
