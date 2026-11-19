"use client";

import type { CSSProperties } from "react";

import { PostSearchAppBar } from "@/features/community/presentation/search/post-search-app-bar";
import { SubviewScrollShell } from "@/features/community/presentation/subview-scroll-shell";
import { Skeleton } from "@/shared/ui/skeleton";

/** 덩어리마다 150ms씩 늦춰 위에서 아래로 물결치게 깜빡인다(메인 피드 스켈레톤과 같은 방식). */
function pulseDelay(order: number): CSSProperties {
  return { animationDelay: `${order * 150}ms` };
}

/**
 * 글 검색 라우트 로딩 (#591) — 라우트 loading.tsx가 그린다.
 *
 * 앱바는 진짜 모양(검색칸 자리)을 그리되 뒤로가기는 뺀다(PostSearchAppBar showBack). 아래는 비워 둔다 —
 * 주소에 검색어가 있는지 loading은 알 수 없어, 처음 화면(최근 검색)이면 카드 뼈대가 헛되이 깜빡인다.
 */
export function PostSearchSkeleton() {
  return (
    <SubviewScrollShell className="bg-surface-container">
      <PostSearchAppBar
        value=""
        onValueChange={noop}
        onSubmit={noop}
        showBack={false}
        disabled
      />
    </SubviewScrollShell>
  );
}

function noop() {}

/**
 * 결과를 읽는 동안의 카드 자리 — 결과 수 줄과 카드(제목 · 본문 두 줄)를 실제 목록과 같은 간격으로 잡는다.
 * 깜빡임은 동작 줄이기면 멈춘다.
 */
export function PostSearchResultsSkeleton() {
  return (
    <div aria-hidden>
      {/* 결과 수 줄: 위 12 · 높이 21(Body S) */}
      <div
        style={pulseDelay(0)}
        className="flex h-[33px] items-end px-4 motion-safe:animate-pulse"
      >
        <Skeleton className="h-3.5 w-20" />
      </div>
      {/* 카드: 목록 위 4(pt-1), 카드 눌림 여백 위아래 12 · 좌우 8(mx-2 px-2 py-3), 카드 사이 16(mb-4). */}
      <div className="flex flex-col pt-1">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            style={pulseDelay(index + 1)}
            className="mx-2 mb-4 flex flex-col px-2 py-3 motion-safe:animate-pulse"
          >
            <div className="flex items-center gap-1.5">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <Skeleton className="h-3.5 w-20" />
            </div>
            <div className="mt-2 flex h-6 items-center">
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
