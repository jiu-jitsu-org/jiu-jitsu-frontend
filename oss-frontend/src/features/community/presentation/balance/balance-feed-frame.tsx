import type { ReactNode } from "react";

import type { BalanceLayout } from "@/features/community/presentation/balance/balance-layout";

/**
 * 밸런스 게임 영역과 그 아래 피드를 배치에 맞게 묶는다(#305).
 *
 * 2-A(hero-sheet)만 피드를 시트로 감싼다 — 손잡이 달린 둥근 판이 히어로 아래쪽을 20만큼 덮으며
 * 올라와, 게임(배경)과 피드(시트)가 다른 층이라는 것을 재질로 드러낸다. 나머지 배치는 위아래로
 * 이어 붙이기만 한다.
 *
 * 게임이 없으면(진행 중인 판 없음) 시트도 두지 않는다 — 덮을 히어로가 없는 시트는 이유 없는 모서리다.
 */
export function BalanceFeedFrame({
  layout,
  balance,
  children,
}: {
  layout: BalanceLayout;
  balance: ReactNode;
  children: ReactNode;
}) {
  if (!balance || layout !== "hero-sheet") {
    return (
      <>
        {balance}
        {children}
      </>
    );
  }

  return (
    <>
      {balance}
      {/*
        위로 드리우는 그림자는 짧고 옅게 — 시트가 히어로 위에 올라탄 정도만 알린다.
        z-index를 주지 않는다 — 히어로보다 뒤에 그려져 이미 그 위에 오고, 숫자를 주면 z가 없는
        글쓰기 FAB(fixed)까지 덮는다.
      */}
      <div className="relative -mt-5 rounded-t-3xl bg-[var(--bw-white)] pt-2 shadow-[0_-8px_20px_-14px_rgba(15,23,42,0.22)]">
        <BalanceSheetHandle />
        {children}
      </div>
    </>
  );
}

/**
 * 시트 손잡이 — 바텀시트(BottomSheetFrame)와 같은 모양·색. 시트와 접힌 시트 머리가 함께 쓴다.
 * 끌어서 움직이지 않는 장식이라 보조기기에는 숨긴다.
 */
export function BalanceSheetHandle() {
  return (
    <span aria-hidden className="flex justify-center">
      <span className="h-1 w-10 rounded-full bg-bottom-sheet-selected-container-handle" />
    </span>
  );
}
