"use client";

import type { CSSProperties } from "react";

import { AppBarShell } from "@/features/community/presentation/app-bar-shell";
import { BalanceBoardSkeleton } from "@/features/community/presentation/balance/balance-board-skeleton";
import { closeDetail } from "@/features/community/presentation/close-detail";
import { Divider } from "@/shared/ui/divider";
import { IconButton } from "@/shared/ui/icon-button";
import { BackArrowIcon } from "@/shared/ui/icons";
import { Skeleton } from "@/shared/ui/skeleton";

/** 덩어리마다 150ms씩 늦춰 위에서 아래로 물결치게 깜빡인다(메인 피드 스켈레톤과 같은 방식). */
function pulseDelay(order: number): CSSProperties {
  return { animationDelay: `${order * 150}ms` };
}

/**
 * 상세(게시글 · 밸런스 게임) 로딩 스켈레톤 — 라우트 loading.tsx가 그린다.
 *
 * 앱바 + 본문 머리(작성자 · 제목 · 메타) + 본문 + 우측 액션바 + 디바이더 자리를 실제 상세와 같은
 * 간격으로 잡아, 데이터가 와도 덩어리 위치가 거의 움직이지 않게 한다.
 * 뒤로가기만은 진짜 버튼이다 — 느린 조회에 갇히지 않고 나갈 수 있어야 한다(상세 앱바와 같은 규격 · 경로).
 * 깜빡임은 동작 줄이기면 멈춘다.
 */
export function DetailSkeleton({ variant }: { variant: "post" | "balance" }) {
  return (
    <div className="min-h-dvh bg-[var(--bw-true-white)]">
      <AppBarShell>
        <IconButton onClick={closeDetail} aria-label="뒤로 가기">
          <BackArrowIcon size={24} />
        </IconButton>
      </AppBarShell>

      <div aria-hidden>
        {variant === "post" ? <PostBodySkeleton /> : <BalanceBodySkeleton />}

        {/* 액션바: 우측 정렬 리액션 버튼 자리(높이 28) */}
        <div
          style={pulseDelay(3)}
          className={`flex justify-end gap-2 px-4 motion-safe:animate-pulse ${variant === "post" ? "mt-[13px]" : "mt-10"}`}
        >
          <Skeleton className="h-7 w-12" />
          <Skeleton className="h-7 w-12" />
          <Skeleton className="h-7 w-12" />
        </div>

        {/* 액션바 아래 디바이더: 간격 24, 풀폭, 높이 4 — 실제 상세와 같은 면 */}
        <Divider className="mt-6" />
      </div>
    </div>
  );
}

/** 게시글: 작성자 행(24) · 제목 · 메타 · 본문 세 줄. 위 24 · 좌우 16 · 묶음 간격 16. */
function PostBodySkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <div
        style={pulseDelay(0)}
        className="flex h-6 items-center gap-2 motion-safe:animate-pulse"
      >
        <Skeleton className="size-6 rounded-full" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div
        style={pulseDelay(1)}
        className="flex flex-col motion-safe:animate-pulse"
      >
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="mt-2 h-3 w-32" />
      </div>
      <div
        style={pulseDelay(2)}
        className="flex flex-col gap-2 motion-safe:animate-pulse"
      >
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
      </div>
    </div>
  );
}

/** 밸런스 게임: 스코어보드 판(위 20) · 조회수 줄(판 아래 12) — 실제 상세(BalanceDetailView)와 같은 간격. */
function BalanceBodySkeleton() {
  return (
    <div className="flex flex-col px-4 pt-5">
      <BalanceBoardSkeleton variant="detail" style={pulseDelay(0)} />
      <div
        style={pulseDelay(1)}
        className="mt-3 px-1 motion-safe:animate-pulse"
      >
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}
