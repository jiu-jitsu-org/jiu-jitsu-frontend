import type { CSSProperties } from "react";

import { BalanceBoardSkeleton } from "@/features/community/presentation/balance/balance-board-skeleton";

/**
 * 메인 피드 로딩 스켈레톤.
 *
 * Server Component가 GET /board 응답을 기다리는 동안 노출된다(Next.js route loading).
 * 위에 오늘의 밸런스 게임 자리, 아래에 실제 FeedCard 레이아웃(좌우 px-4, 카드 사이 16)을 흉내 낸
 * 자리표시 카드를 둔다. 밸런스 자리를 비워 두면 데이터가 왔을 때 목록이 한 번에 아래로 밀린다
 * (진행 중인 판이 없는 날은 반대로 한 번 올라온다 — 판이 있는 날이 기본이라 이쪽에 맞춘다).
 *
 * 깜빡임(pulse)은 카드마다 150ms씩 늦춰 위에서 아래로 물결치게 하고, 동작 줄이기면 멈춘다.
 */
export default function Loading() {
  return (
    <main className="min-h-screen bg-[var(--bw-white)]" aria-hidden>
      <BalanceGameSkeleton />
      <div className="flex flex-col gap-4 pt-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            style={pulseDelay(index + 1)}
            className="flex flex-col gap-3 px-4 py-4 motion-safe:animate-pulse"
          >
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-full bg-feed-card-header-avatar-bg" />
              <div className="h-4 w-24 rounded bg-feed-card-header-avatar-bg" />
            </div>
            <div className="h-4 w-2/3 rounded bg-feed-card-header-avatar-bg" />
            <div className="h-3 w-full rounded bg-feed-card-header-avatar-bg" />
            <div className="h-3 w-5/6 rounded bg-feed-card-header-avatar-bg" />
          </div>
        ))}
      </div>
    </main>
  );
}

/** 위에서부터 차례로 깜빡이도록 카드 순서만큼 늦춘다. */
function pulseDelay(order: number): CSSProperties {
  return { animationDelay: `${order * 150}ms` };
}

/** 오늘의 밸런스 게임 자리 — 홈 맨 위 스코어보드 판과 같은 먹색 뼈대(#305). */
function BalanceGameSkeleton() {
  return <BalanceBoardSkeleton variant="hero" style={pulseDelay(0)} />;
}
