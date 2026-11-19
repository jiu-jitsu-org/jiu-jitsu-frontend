import type { CSSProperties } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * 피드 카드 자리표시 4장 — 홈 첫 로딩(app/loading.tsx)과 카테고리 탭을 바꿔 읽는 동안(#590)이 같은 모양을 쓴다.
 *
 * 실제 FeedCard 레이아웃(좌우 px-4, 카드 사이 16)을 흉내 낸다. 깜빡임(pulse)은 카드마다 150ms씩 늦춰
 * 위에서 아래로 물결치게 하고, 동작 줄이기면 멈춘다. firstDelay는 위에 다른 자리표시(밸런스 게임)가 있으면 1 —
 * 물결이 그 아래에서 이어진다.
 */
export function FeedCardsSkeleton({
  firstDelay = 0,
  className,
}: {
  firstDelay?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 pt-6", className)} aria-hidden>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          style={pulseDelay(index + firstDelay)}
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
  );
}

/** 위에서부터 차례로 깜빡이도록 순서만큼 늦춘다. */
export function pulseDelay(order: number): CSSProperties {
  return { animationDelay: `${order * 150}ms` };
}
