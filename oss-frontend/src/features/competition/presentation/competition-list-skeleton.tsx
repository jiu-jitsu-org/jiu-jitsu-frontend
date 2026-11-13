import type { CSSProperties } from "react";

import { Skeleton } from "@/shared/ui/skeleton";

/** 줄마다 150ms씩 늦춰 위에서 아래로 물결치게 깜빡인다(메인 피드 스켈레톤과 같은 방식). */
function pulseDelay(order: number): CSSProperties {
  return { animationDelay: `${order * 150}ms` };
}

/**
 * 대회 탭 첫 화면 로딩 스켈레톤 — 라우트 loading.tsx가 그린다(#452).
 *
 * 자기 스켈레톤이 없으면 루트 loading(메인 피드 — 먹색 밸런스 판)이 대신 떠서 목록이 오면 통째로 바뀌었다.
 * 목록과 같은 바탕에 필터 줄(위아래 12 · 칩 32)과 날짜 칸(36) + 대회 카드 줄을 같은 간격으로 둔다.
 * 앱 대회 탭은 아직 네이티브 로딩 덮개가 덮어 이 스켈레톤은 웹 단독 · 새로고침에서 보인다.
 */
export function CompetitionListSkeleton() {
  return (
    // feed-bounce-scroll: 목록처럼 맨 위에서 당기면 앱의 당겨서 새로고침이 걸리게 바운스를 연다.
    <main
      aria-hidden
      className="feed-bounce-scroll min-h-screen bg-surface-container"
    >
      <div
        style={pulseDelay(0)}
        className="flex gap-2 px-4 py-3 motion-safe:animate-pulse"
      >
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-8 w-14 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
      <ul className="flex flex-col gap-3 px-4 pt-1">
        {Array.from({ length: 4 }).map((_, index) => (
          <li
            key={index}
            style={pulseDelay(index + 1)}
            className="flex items-start gap-2 motion-safe:animate-pulse"
          >
            <div className="flex h-14 w-9 flex-none items-center justify-center">
              <Skeleton className="h-5 w-6" />
            </div>
            <Skeleton className="h-24 min-w-0 flex-1 rounded-20" />
          </li>
        ))}
      </ul>
    </main>
  );
}
