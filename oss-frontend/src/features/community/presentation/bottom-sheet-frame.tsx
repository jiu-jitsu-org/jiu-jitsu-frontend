"use client";

import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

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
  const [visible, setVisible] = useState(false);

  // 열릴 때 한 프레임 뒤 전환 / 닫힐 때 내려간 뒤 언마운트. 딤은 페이드, 시트는 아래에서 올라온다.
  useEffect(() => {
    if (!open) {
      const raf = requestAnimationFrame(() => setVisible(false));
      const timer = setTimeout(() => setMounted(false), SHEET_FADE_MS);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    }

    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      setMounted(true);
      raf2 = requestAnimationFrame(() => setVisible(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [open]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* 딤(바깥 탭 시 닫기) — 웹뷰 영역까지만 덮이는 건 웹 표면의 한계다. */}
      <button
        type="button"
        aria-label="닫기"
        onClick={onDismiss}
        className={cn(
          "absolute inset-0 bg-bottom-sheet-selected-container-scrim transition-opacity duration-200",
          visible ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        // 올라올 때 500ms 감속(넘침 없음) / 내려갈 때 200ms 가속(호출부가 200ms 뒤 언마운트한다). 동작 줄이기면 이동 없이 바로 뜬다.
        // 아래 여백 20은 홈 인디케이터 위에서 센다 — 브라우저에서는 inset이 0이라 20 그대로다.
        className={cn(
          "relative w-full rounded-t-[20px] bg-bottom-sheet-selected-container-background px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]",
          "motion-safe:transition-[translate]",
          visible
            ? "translate-y-0 duration-500 ease-smooth-out"
            : "translate-y-full duration-200 ease-in",
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
