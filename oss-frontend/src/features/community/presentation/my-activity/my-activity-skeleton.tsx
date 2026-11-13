import type { CSSProperties } from "react";

import { MyActivityAppBar } from "@/features/community/presentation/my-activity/my-activity-app-bar";
import { MY_ACTIVITY_TABS } from "@/features/community/presentation/my-activity/my-activity-tab";
import { SubviewScrollShell } from "@/features/community/presentation/subview-scroll-shell";
import { Skeleton } from "@/shared/ui/skeleton";

/** 덩어리마다 150ms씩 늦춰 위에서 아래로 물결치게 깜빡인다(메인 피드 스켈레톤과 같은 방식). */
function pulseDelay(order: number): CSSProperties {
  return { animationDelay: `${order * 150}ms` };
}

/**
 * 내 커뮤니티 활동 로딩 스켈레톤 — 라우트 loading.tsx가 그린다.
 *
 * 앱바는 진짜를 그린다(제목이 바로 보이고, 느린 조회에서도 뒤로 나갈 수 있다).
 * 그 아래 프로필 행(아바타 64 + 닉네임) · 탭(44) · 카드 자리를 실제 화면과 같은 간격으로 잡는다.
 * 깜빡임은 동작 줄이기면 멈춘다.
 */
export function MyActivitySkeleton() {
  return (
    <SubviewScrollShell className="bg-surface-container">
      <MyActivityAppBar />
      <MyActivitySkeletonBody />
    </SubviewScrollShell>
  );
}

/**
 * 앱바 아래 자리(프로필 · 탭 · 카드) — 세션 복구 중 표시(MyActivityScreen)도 같은 모양을 쓴다.
 * 카드는 첫 탭(쓴 글) 모양이다. 앱은 늘 첫 탭으로 열고, 다른 탭은 주소(?tab=)로 바로 들어올 때만 어긋난다.
 */
export function MyActivitySkeletonBody() {
  return (
    <div aria-hidden>
      {/* 프로필 행: 위 12 · 좌우 16 · 아래 20, 간격 12 */}
      <div
        style={pulseDelay(0)}
        className="flex items-center gap-3 px-4 pt-3 pb-5 motion-safe:animate-pulse"
      >
        <Skeleton className="size-16 shrink-0 rounded-full" />
        <Skeleton className="h-6 w-28" />
      </div>

      {/* 탭: 높이 44, 탭 수(MY_ACTIVITY_TABS)만큼 칸 가운데에 라벨 자리 */}
      <div style={pulseDelay(1)} className="flex px-4 motion-safe:animate-pulse">
        {MY_ACTIVITY_TABS.map(({ value }) => (
          <div
            key={value}
            className="flex h-11 flex-1 items-center justify-center"
          >
            <Skeleton className="h-4 w-14" />
          </div>
        ))}
      </div>

      {/* 카드: 첫 탭(쓴 글)의 목록과 같은 자리 — 목록 위 4(pt-1), 카드 눌림 여백 위아래 12 · 좌우 8(mx-2 px-2 py-3),
          카드 사이 16(mb-4). 글줄이 실제 카드와 같은 위치(탭 아래 16)에서 시작한다(#452). */}
      <div className="flex flex-col pt-1">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            style={pulseDelay(index + 2)}
            className="mx-2 mb-4 flex flex-col px-2 py-3 motion-safe:animate-pulse"
          >
            <div className="flex h-6 items-center">
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="mt-2 flex flex-col gap-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
