import type { CSSProperties } from "react";

import { MyActivityAppBar } from "@/features/community/presentation/my-activity/my-activity-app-bar";
import { SubviewScrollShell } from "@/features/community/presentation/subview-scroll-shell";

/** 덩어리마다 150ms씩 늦춰 위에서 아래로 물결치게 깜빡인다(메인 피드 스켈레톤과 같은 방식). */
function pulseDelay(order: number): CSSProperties {
  return { animationDelay: `${order * 150}ms` };
}

const BLOCK = "rounded bg-feed-card-header-avatar-bg";

/**
 * 내 커뮤니티 활동 로딩 스켈레톤 — 라우트 loading.tsx가 그린다.
 *
 * 앱바는 진짜를 그린다(제목이 바로 보이고, 느린 조회에서도 뒤로 나갈 수 있다).
 * 그 아래 프로필 행(아바타 64 + 닉네임) · 탭(44) · 카드 자리를 실제 화면과 같은 간격으로 잡는다.
 * 깜빡임은 동작 줄이기면 멈춘다.
 */
export function MyActivitySkeleton() {
  return (
    <SubviewScrollShell className="bg-[var(--bw-white)]">
      <MyActivityAppBar />

      <div aria-hidden>
        {/* 프로필 행: 위 12 · 좌우 16 · 아래 20, 간격 12 */}
        <div
          style={pulseDelay(0)}
          className="flex items-center gap-3 px-4 pt-3 pb-5 motion-safe:animate-pulse"
        >
          <div className="size-16 shrink-0 rounded-full bg-feed-card-header-avatar-bg" />
          <div className={`h-6 w-28 ${BLOCK}`} />
        </div>

        {/* 탭: 높이 44, 두 칸 가운데에 라벨 자리 */}
        <div
          style={pulseDelay(1)}
          className="flex px-4 motion-safe:animate-pulse"
        >
          <div className="flex h-11 flex-1 items-center justify-center">
            <div className={`h-4 w-14 ${BLOCK}`} />
          </div>
          <div className="flex h-11 flex-1 items-center justify-center">
            <div className={`h-4 w-14 ${BLOCK}`} />
          </div>
        </div>

        {/* 카드: 목록 위 16(pt-4), 카드 사이 16 — 메인 피드 스켈레톤과 같은 자리표시 카드 */}
        <div className="flex flex-col gap-4 pt-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              style={pulseDelay(index + 2)}
              className="flex flex-col gap-3 px-4 py-4 motion-safe:animate-pulse"
            >
              <div className={`h-4 w-2/3 ${BLOCK}`} />
              <div className={`h-3 w-full ${BLOCK}`} />
              <div className={`h-3 w-5/6 ${BLOCK}`} />
            </div>
          ))}
        </div>
      </div>
    </SubviewScrollShell>
  );
}
