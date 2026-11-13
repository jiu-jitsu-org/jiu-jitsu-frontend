import type { CSSProperties } from "react";

import { InboxAppBar } from "@/features/community/presentation/notifications/inbox-app-bar";
import { SubviewScrollShell } from "@/features/community/presentation/subview-scroll-shell";
import { Skeleton } from "@/shared/ui/skeleton";

/** 줄마다 150ms씩 늦춰 위에서 아래로 물결치게 깜빡인다(차단 목록 스켈레톤과 같은 방식). */
function pulseDelay(order: number): CSSProperties {
  return { animationDelay: `${order * 150}ms` };
}

/**
 * 알림함 로딩 스켈레톤 — 라우트 loading.tsx가 그린다(#452).
 *
 * 자기 스켈레톤이 없으면 루트 loading(메인 피드 — 회색 바탕 · 먹색 판)이 대신 떠서 목록이 오면 통째로 바뀌었다.
 * 앱바는 진짜를 그린다("모두 읽음"은 비활성). 뒤로가기는 빼 둔다 — 앱의 비상용 뒤로가기와 겹치지 않게(InboxAppBar showBack).
 * 그 아래 "새 알림" 줄(44)과 알림 줄(아이콘 32 · 위아래 16)을 실제 목록과 같은 간격으로 잡는다.
 */
export function InboxSkeleton() {
  return (
    <SubviewScrollShell className="bg-[var(--bw-true-white)]">
      <InboxAppBar canMarkAllRead={false} showBack={false} />
      <InboxSkeletonRows />
    </SubviewScrollShell>
  );
}

/** 앱바 아래 줄 자리 — 세션 복구 중 표시(InboxScreen)도 같은 모양을 쓴다. */
export function InboxSkeletonRows() {
  return (
    <div aria-hidden>
      <div
        style={pulseDelay(0)}
        className="flex h-11 items-center pl-5 motion-safe:animate-pulse"
      >
        <Skeleton className="h-3.5 w-16" />
      </div>
      <ul>
        {Array.from({ length: 5 }).map((_, index) => (
          <li
            key={index}
            style={pulseDelay(index + 1)}
            className="flex items-start gap-3 px-4 py-4 motion-safe:animate-pulse"
          >
            <Skeleton className="size-8 shrink-0 rounded-10" />
            <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
