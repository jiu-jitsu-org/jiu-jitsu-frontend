"use client";

import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/shared/lib/cn";
import { useNativeSheetOpen } from "@/shared/lib/native-bridge";
import { useViewportRect } from "@/features/community/presentation/use-viewport-rect";

/** 딤 페이드·시트 내려가기 시간(ms). 호출부도 닫은 뒤 이만큼 기다렸다 언마운트한다. */
export const SHEET_FADE_MS = 200;

/**
 * 바텀시트 껍데기 — 딤 + 아래에서 올라오는 시트 + 핸들바 + 제목.
 *
 * 안쪽 내용(선택지·CTA)은 호출부가 children으로 채운다. SelectSheet(라디오 + 하단 CTA)와
 * PhotoSourceSheet(탭 즉시 실행하는 항목)가 같은 모양·토큰·전환을 공유하려고 뽑아냈다.
 *
 * 여는 상태는 호출부가 소유한다(controlled). 닫히면 내려간 뒤 스스로 언마운트한다.
 */
export function BottomSheetFrame({
  open,
  title,
  message,
  onDismiss,
  children,
}: {
  open: boolean;
  title: string;
  message?: string;
  onDismiss: () => void;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(open);
  // 내려가는 도중(아직 붙어 있음)에 다시 열렸나 — 그때는 키프레임으로 맨 아래부터 다시 올리지 않고 그 자리에서 전환으로 올린다.
  const [prevOpen, setPrevOpen] = useState(open);
  const [resumed, setResumed] = useState(false);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setResumed(mounted);
  }
  // 내려가는 동안까지(mounted) 앱 탭 바를 숨겨 둔다 — 시트가 화면 맨 아래까지 내려와 탭 바 자리에 색 면이 안 생긴다.
  useNativeSheetOpen(open || mounted);
  // 키보드 위 '실제 보이는 영역'에 시트를 맞춘다(visualViewport). 이 WKWebView에선 키보드가 떠도 fixed inset-0가
  // 안 줄어, 바닥에 붙은 시트가 키보드 뒤로 깔린다 — 검색으로 목록이 짧아지면 시트 전체가 키보드에 가려졌다(#467).
  // 글쓰기 셸(post-write-screen)과 같은 기준이다. 키보드가 떠 있고 확대하지 않았을 때만 쓴다 — 브라우저에서 핀치 확대하면
  // 보이는 영역이 줄어 시트가 엉뚱하게 줄고 밀리므로 그때는 전처럼 화면 전체에 붙인다. offsetTop이 음수인 순간은 0으로 묶는다.
  const viewport = useViewportRect(mounted);
  const rect =
    viewport?.keyboardOpen && Math.abs(viewport.scale - 1) < 0.01
      ? viewport
      : null;

  // 열릴 때는 나타나는 순간 키프레임으로 올라온다(sheet-up · 딤 scrim-in) — 예전처럼 두 프레임 뒤 전환을 걸면
  // 붙는 렌더와 켜는 렌더가 한 번에 묶이는 기기에서 움직임 없이 툭 떴다. 닫힐 때는 전환으로 내려간 뒤 언마운트.
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => setMounted(false), SHEET_FADE_MS);
      return () => clearTimeout(timer);
    }
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, [open]);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-x-0 z-50 flex items-end"
      style={
        rect
          ? { top: Math.max(0, rect.top), height: rect.height }
          : { top: 0, bottom: 0 }
      }
    >
      {/* 딤(바깥 탭 시 닫기) — 웹뷰 영역까지만 덮이는 건 웹 표면의 한계다. */}
      <button
        type="button"
        aria-label="닫기"
        onClick={onDismiss}
        className={cn(
          "absolute inset-0 bg-bottom-sheet-selected-container-scrim",
          !open
            ? "opacity-0 transition-opacity duration-200"
            : resumed
              ? "opacity-100 transition-opacity duration-300"
              : "opacity-100 motion-safe:animate-scrim-in",
        )}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        // 올라올 때 450ms iOS 시트 곡선(넘침 없음, sheet-up) / 내려갈 때 200ms 가속(호출부가 200ms 뒤 언마운트한다).
        // 동작 줄이기면 이동 없이 바로 뜬다.
        // 아래 여백 20은 홈 인디케이터 위에서 센다 — 브라우저에서는 inset이 0이라 20 그대로다. 키보드가 떠 있으면
        // 시트가 키보드 바로 위에 앉으니 홈 인디케이터 몫은 뺀다.
        // 보이는 영역보다 길어지면 상태바 + 16을 남기고 줄인다 — 안쪽 목록(min-h-0)이 먼저 줄고, 그런 목록이 없는 시트는 통째로 스크롤된다.
        className={cn(
          "relative mx-auto flex max-h-[calc(100%-var(--safe-area-top)-1rem)] w-full max-w-[var(--app-max-w)] flex-col overflow-y-auto overscroll-contain rounded-t-20 bg-bottom-sheet-selected-container-background px-5",
          rect?.keyboardOpen
            ? "pb-5"
            : "pb-[calc(1.25rem+var(--safe-area-bottom))]",
          !open
            ? "translate-y-full motion-safe:transition-[translate] motion-safe:duration-200 motion-safe:ease-in"
            : resumed
              ? "translate-y-0 motion-safe:transition-[translate] motion-safe:duration-450 motion-safe:ease-[cubic-bezier(0.32,0.72,0,1)]"
              : "translate-y-0 motion-safe:animate-sheet-up",
        )}
      >
        {/* 핸들바: 상단 여백 8, 폭 40 높이 4 */}
        <div className="flex justify-center pt-2">
          <span className="h-1 w-10 rounded-full bg-bottom-sheet-selected-container-handle" />
        </div>

        {/* 제목: Title2(Semibold 20) */}
        <h2 className="mt-4 text-left text-title-2 text-bottom-sheet-selected-container-title">
          {title}
        </h2>
        {message ? (
          // 보조 설명: Body S(14/21)
          <p className="mt-1 text-left text-body-s text-text-secondary">
            {message}
          </p>
        ) : null}

        {children}
      </div>
    </div>
  );
}
