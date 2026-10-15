"use client";

import type { CSSProperties } from "react";

import { AppBarShell } from "@/features/community/presentation/app-bar-shell";
import { closeDetail } from "@/features/community/presentation/close-detail";
import { BackArrowIcon } from "@/shared/ui/icons";
import { ICON_BUTTON_PRESS } from "@/shared/ui/press-styles";

/** 덩어리마다 150ms씩 늦춰 위에서 아래로 물결치게 깜빡인다(메인 피드 스켈레톤과 같은 방식). */
function pulseDelay(order: number): CSSProperties {
  return { animationDelay: `${order * 150}ms` };
}

const BLOCK = "rounded bg-feed-card-header-avatar-bg";

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
        <button
          type="button"
          onClick={closeDetail}
          aria-label="뒤로 가기"
          className={`inline-flex size-10 items-center justify-center text-icon-primary ${ICON_BUTTON_PRESS}`}
        >
          <BackArrowIcon size={24} />
        </button>
      </AppBarShell>

      <div aria-hidden>
        {variant === "post" ? <PostBodySkeleton /> : <BalanceBodySkeleton />}

        {/* 액션바: 우측 정렬 리액션 버튼 자리(높이 28) */}
        <div
          style={pulseDelay(3)}
          className={`flex justify-end gap-2 px-4 motion-safe:animate-pulse ${variant === "post" ? "mt-[13px]" : "mt-10"}`}
        >
          <div className={`h-7 w-12 ${BLOCK}`} />
          <div className={`h-7 w-12 ${BLOCK}`} />
          <div className={`h-7 w-12 ${BLOCK}`} />
        </div>

        {/* 액션바 아래 디바이더: 간격 24, 풀폭, 높이 4 — 실제 상세와 같은 면 */}
        <div className="mt-6 h-1 bg-divider-bg" />
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
        <div className="size-6 rounded-full bg-feed-card-header-avatar-bg" />
        <div className={`h-4 w-20 ${BLOCK}`} />
      </div>
      <div
        style={pulseDelay(1)}
        className="flex flex-col motion-safe:animate-pulse"
      >
        <div className={`h-5 w-2/3 ${BLOCK}`} />
        <div className={`mt-2 h-3 w-32 ${BLOCK}`} />
      </div>
      <div
        style={pulseDelay(2)}
        className="flex flex-col gap-2 motion-safe:animate-pulse"
      >
        <div className={`h-3.5 w-full ${BLOCK}`} />
        <div className={`h-3.5 w-full ${BLOCK}`} />
        <div className={`h-3.5 w-4/5 ${BLOCK}`} />
      </div>
    </div>
  );
}

/** 밸런스 게임: 제목 · 메타 · 타이머 배지(위 24) · 선택지 66 × 2(위 16, 간격 4). */
function BalanceBodySkeleton() {
  return (
    <div className="flex flex-col px-4 pt-6">
      <div
        style={pulseDelay(0)}
        className="flex flex-col motion-safe:animate-pulse"
      >
        <div className={`h-5 w-36 ${BLOCK}`} />
        <div className={`mt-2 h-3 w-32 ${BLOCK}`} />
      </div>
      <div
        style={pulseDelay(1)}
        className="mt-6 flex justify-center motion-safe:animate-pulse"
      >
        <div className="h-8 w-28 rounded-full bg-feed-card-header-avatar-bg" />
      </div>
      <div
        style={pulseDelay(2)}
        className="mt-4 flex flex-col gap-1 motion-safe:animate-pulse"
      >
        <div className="h-[66px] rounded-xl bg-feed-card-header-avatar-bg" />
        <div className="h-[66px] rounded-xl bg-feed-card-header-avatar-bg" />
      </div>
    </div>
  );
}
