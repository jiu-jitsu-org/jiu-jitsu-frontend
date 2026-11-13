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

/**
 * 게시글: 작성자 행(띠 아바타 32) · 제목(줄 24) · 메타(줄 16, 위 6) · 본문 세 줄(줄 21, 위 12).
 * 실제 상세(PostDetailView · PostAuthorRow · PostDetailBody)와 같은 줄 높이 · 간격이라 데이터가 와도 위쪽 덩어리가
 * 움직이지 않는다(#452). 글 길이 · 사진 · 태그는 미리 알 수 없어 본문 세 줄 아래부터는 맞추지 않는다.
 */
function PostBodySkeleton() {
  return (
    <div className="flex flex-col gap-2 px-4 pt-6">
      {/* 작성자 행: 띠 아바타 32 · 닉네임 간격 6 */}
      <div
        style={pulseDelay(0)}
        className="flex h-8 items-center gap-1.5 motion-safe:animate-pulse"
      >
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="h-3.5 w-20" />
      </div>
      {/* 제목 · 메타 · 본문: 글줄은 띠 아바타 보정으로 2 들인다(pl-0.5) */}
      <div className="flex flex-col pl-0.5">
        <div
          style={pulseDelay(1)}
          className="flex flex-col motion-safe:animate-pulse"
        >
          <div className="flex h-6 items-center">
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="mt-1.5 flex h-4 items-center">
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div
          style={pulseDelay(2)}
          className="mt-3 flex flex-col motion-safe:animate-pulse"
        >
          <div className="flex h-[21px] items-center">
            <Skeleton className="h-3.5 w-full" />
          </div>
          <div className="flex h-[21px] items-center">
            <Skeleton className="h-3.5 w-full" />
          </div>
          <div className="flex h-[21px] items-center">
            <Skeleton className="h-3.5 w-4/5" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** 밸런스 게임: 스코어보드 판(위 20) · 조회수 줄(판 아래 12, 줄 16) — 실제 상세(BalanceDetailView)와 같은 간격. */
function BalanceBodySkeleton() {
  return (
    <div className="flex flex-col px-4 pt-5">
      <BalanceBoardSkeleton variant="detail" style={pulseDelay(0)} />
      <div
        style={pulseDelay(1)}
        className="mt-3 flex h-4 items-center px-1 motion-safe:animate-pulse"
      >
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}
