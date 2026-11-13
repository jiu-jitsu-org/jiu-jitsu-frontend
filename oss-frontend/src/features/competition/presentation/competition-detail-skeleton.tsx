"use client";

import type { CSSProperties } from "react";

import { AppBarShell } from "@/features/community/presentation/app-bar-shell";
import { closeDetail } from "@/features/community/presentation/close-detail";
import { SubviewScrollShell } from "@/features/community/presentation/subview-scroll-shell";
import { IconButton } from "@/shared/ui/icon-button";
import { BackArrowIcon } from "@/shared/ui/icons";
import { Skeleton } from "@/shared/ui/skeleton";

/** 덩어리마다 150ms씩 늦춰 위에서 아래로 물결치게 깜빡인다(상세 스켈레톤과 같은 방식). */
function pulseDelay(order: number): CSSProperties {
  return { animationDelay: `${order * 150}ms` };
}

/**
 * 대회 상세 로딩 스켈레톤 — 라우트 loading.tsx가 그린다(#452).
 *
 * 자기 스켈레톤이 없으면 루트 loading(메인 피드 — 먹색 판 · 앱바 없음)이 대신 떠서 상세가 오면 통째로 바뀌었다.
 * 상세와 같은 셸 · 바탕 · 앱바 규격(AppBarShell)에 요약(상태 줄 · 이름 · 조회 줄)과 정보 상자 자리를 둔다.
 * 앱바의 알림 · 공유는 대회를 받아야 정해져 비우고, 뒤로가기만 진짜 버튼으로 둔다.
 */
export function CompetitionDetailSkeleton() {
  return (
    <SubviewScrollShell className="bg-surface-container">
      <AppBarShell>
        <IconButton onClick={closeDetail} aria-label="뒤로 가기">
          <BackArrowIcon size={24} />
        </IconButton>
      </AppBarShell>

      <div aria-hidden>
        {/* 요약: 위 16 · 상태 줄(칩 26) · 이름(줄 32, 위 8) · 조회 줄(32, 위 12) */}
        <div
          style={pulseDelay(0)}
          className="flex flex-col px-4 pt-4 motion-safe:animate-pulse"
        >
          <div className="flex h-[26px] items-center">
            <Skeleton className="h-[26px] w-24 rounded-full" />
          </div>
          <div className="mt-2 flex h-8 items-center">
            <Skeleton className="h-6 w-3/4" />
          </div>
          <div className="mt-3 flex h-8 items-center">
            <Skeleton className="h-3.5 w-20" />
          </div>
        </div>
        {/* 기본 정보 상자: 위 20 · 반경 20 — CompetitionInfoSection(제목 없는 DetailSection pt-5)과 같은 간격 */}
        <div
          style={pulseDelay(1)}
          className="px-4 pt-5 motion-safe:animate-pulse"
        >
          <Skeleton className="h-40 w-full rounded-20" />
        </div>
      </div>
    </SubviewScrollShell>
  );
}
