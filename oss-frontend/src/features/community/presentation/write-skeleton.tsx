"use client";

import type { CSSProperties } from "react";

import { AppBarShell } from "@/features/community/presentation/app-bar-shell";
import { closeDetail } from "@/features/community/presentation/close-detail";
import {
  APP_BAR_BUTTON_SIZE,
  APP_BAR_BUTTON_TOP,
  APP_BAR_HEIGHT,
  APP_BAR_TITLE_HEIGHT,
  APP_BAR_TITLE_TOP,
} from "@/features/community/presentation/post-write-app-bar-metrics";
import { cn } from "@/shared/lib/cn";
import { IconButton } from "@/shared/ui/icon-button";
import { BackArrowIcon, CheckIcon } from "@/shared/ui/icons";
import { Skeleton } from "@/shared/ui/skeleton";

/** 덩어리마다 150ms씩 늦춰 위에서 아래로 물결치게 깜빡인다(상세 스켈레톤과 같은 방식). */
function pulseDelay(order: number): CSSProperties {
  return { animationDelay: `${order * 150}ms` };
}

/**
 * 글쓰기 · 글 수정 로딩 스켈레톤 — 라우트 loading.tsx와 수정 화면의 세션 복구 중 표시가 그린다(#452).
 *
 * 자기 스켈레톤이 없으면 루트 loading(메인 피드 — 먹색 판 · 회색 바탕 · 앱바 없음)이 대신 떠서,
 * 폼이 오면 화면이 통째로 바뀌었다. 흰 바탕 · 같은 규격의 앱바(52) · 카테고리 칩 줄 · 제목 · 본문 자리를
 * 실제 폼과 같은 위치에 둔다. 뒤로가기는 그리지 않는다 — 앱은 그동안 자기 비상용 뒤로가기(좌 8 · 40)를 띄워,
 * 위치가 다른 글쓰기 뒤로가기(좌 16 · 36)까지 있으면 둘이 어긋나 겹쳐 보인다. 웹 단독은 브라우저 뒤로가기가 있다.
 * 등록 · 완료 버튼은 같은 모양으로 그려 두기만 한다(누를 것이 없다) — 비우면 폼이 올 때 버튼이 새로 생긴다.
 */
export function WriteSkeleton({
  mode,
  showBack = false,
}: {
  mode: "write" | "edit";
  /**
   * 세션 복구 중 표시에서는 뒤로가기를 그린다 — 그때는 문서 로드가 끝나 앱의 비상용 뒤로가기가 사라지고,
   * 수정 화면은 이탈 가드로 스와이프 백도 막혀 있어 웹 버튼이 없으면 나갈 길이 없다.
   */
  showBack?: boolean;
}) {
  return (
    <div className="fixed inset-x-0 top-0 flex h-dvh flex-col overflow-hidden bg-[var(--bw-true-white)]">
      <AppBarShell
        className="items-start px-4"
        style={{ height: APP_BAR_HEIGHT }}
      >
        {showBack ? (
          <IconButton
            variant="tint"
            size="s"
            onClick={closeDetail}
            aria-label="뒤로 가기"
            style={{ marginTop: APP_BAR_BUTTON_TOP }}
          >
            <BackArrowIcon size={24} />
          </IconButton>
        ) : null}
        {/* 글쓰기 앱바와 같은 자리의 제목 — absolute top은 셸 상단 기준이라 인셋을 더한다. */}
        <h1
          style={{
            top: `calc(env(safe-area-inset-top) + ${APP_BAR_TITLE_TOP}px)`,
            height: APP_BAR_TITLE_HEIGHT,
          }}
          className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 items-center whitespace-nowrap text-title-3 text-header-text"
        >
          {mode === "edit" ? "글 수정" : "글쓰기"}
        </h1>
        {/* 등록(브랜드 채움) · 완료(바꾼 게 없어 비활성 채움) — 폼이 처음 그릴 모양과 같다. */}
        <span
          aria-hidden
          style={{
            width: APP_BAR_BUTTON_SIZE,
            height: APP_BAR_BUTTON_SIZE,
            marginTop: APP_BAR_BUTTON_TOP,
          }}
          className={cn(
            "ml-auto inline-flex items-center justify-center rounded-10",
            mode === "edit"
              ? "bg-button-filled-disabled-bg text-button-filled-disabled-text"
              : "bg-button-filled-default-bg text-button-filled-default-text",
          )}
        >
          <CheckIcon size={24} />
        </span>
      </AppBarShell>

      <div aria-hidden className="flex flex-col px-4">
        {/* 카테고리 칩 줄: 위 20 · 칩 높이 32 · 간격 8 */}
        <div
          style={pulseDelay(0)}
          className="flex gap-2 pt-5 motion-safe:animate-pulse"
        >
          <Skeleton className="h-8 w-14 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-14 rounded-full" />
          <Skeleton className="h-8 w-12 rounded-full" />
        </div>
        {/* 제목(Display 1 · 줄 40) · 본문 자리 */}
        <div
          style={pulseDelay(1)}
          className="mt-6 flex h-10 items-center motion-safe:animate-pulse"
        >
          <Skeleton className="h-7 w-1/2" />
        </div>
        <div
          style={pulseDelay(2)}
          className="mt-4 flex flex-col gap-2 motion-safe:animate-pulse"
        >
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    </div>
  );
}
