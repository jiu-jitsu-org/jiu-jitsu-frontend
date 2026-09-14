"use client";

import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/shared/lib/cn";
import type { ConfirmDialogTitleParts } from "@/shared/lib/native-bridge";

const DIALOG_FADE_MS = 200;

/**
 * 공통 확인 알럿(커스텀 다이얼로그).
 *
 * 제목 + 설명 + [취소 / 확인] 2버튼. 확인이 위험 동작이면 destructive(빨강).
 * 여는 상태/콜백은 호출부가 소유한다(controlled).
 */
export function ConfirmDialog({
  open,
  title,
  titleParts,
  message,
  cancelText = "취소",
  confirmText,
  destructive = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: ReactNode;
  /** 있으면 title 대신 "말줄임 부분 + 온전한 접미사" 조합으로 1줄 고정 렌더(네이티브 알럿과 같은 정책). */
  titleParts?: ConfirmDialogTitleParts;
  message?: ReactNode;
  cancelText?: string;
  confirmText: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  // 알파 페이드: open이 false가 돼도 페이드 아웃 동안 잠시 마운트 유지 후 언마운트.
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!open) {
      // 페이드 아웃 후 언마운트
      const raf = requestAnimationFrame(() => setVisible(false));
      const timer = setTimeout(() => setMounted(false), DIALOG_FADE_MS);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    }
    // 마운트 후 초기 opacity-0 프레임을 그린 뒤 다음 프레임에 1로 전환 → 페이드 인.
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
    // 알럿은 디바이스 좌우 27.5 여백으로 배치(가운데), 높이는 콘텐츠에 따라 가변. 전체 알파 페이드.
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center px-[27.5px] transition-opacity duration-200",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      {/* 딤 배경(바깥 탭 시 취소). dialog/dim-bg 토큰(반투명) → 뒤 콘텐츠가 어둡게 비친다. */}
      <button
        type="button"
        aria-label="닫기"
        onClick={onCancel}
        className="absolute inset-0 bg-dialog-dim-bg"
      />

      <div
        role="dialog"
        aria-modal="true"
        // 폭 = min(320, 화면폭 − 좌우 27.5). 375pt에서 정확히 320, 작은 기기는 여백 유지하며 축소,
        // 큰 기기는 320에서 상한(시스템 알럿처럼 안 커짐). 높이는 콘텐츠 가변. radius 20, 내부 여백 20.
        className="relative w-full max-w-[320px] rounded-[20px] bg-dialog-container-bg px-5 pb-5 pt-5"
      >
        {/* 제목: Title2(Pretendard Semibold 20), 색 dialog/title-text, 좌측 정렬 */}
        {titleParts ? (
          // 1줄 고정: 닉네임(truncatable)만 tail 말줄임, 접미사는 shrink-0으로 항상 온전히.
          // flex 자식이 min-width:auto로 내용만큼 버티면 truncate가 안 걸리므로 min-w-0 필요.
          <h2 className="flex min-w-0 text-left text-title-2 text-dialog-title-text">
            <span className="truncate">{titleParts.truncatable}</span>
            <span className="shrink-0">{titleParts.suffix}</span>
          </h2>
        ) : (
          <h2 className="text-left text-title-2 text-dialog-title-text">
            {title}
          </h2>
        )}
        {message ? (
          // 설명: Body M(16/24), 색 dialog/description-text, 좌측 정렬
          <p className="mt-2 text-left text-body-m text-dialog-description-text">
            {message}
          </p>
        ) : null}

        {/* 버튼: 서브타이틀과 간격 16(mt-4), 버튼끼리 8(gap-2), 높이 51 고정, Button M, radius 15.
            취소=neutral / 확인=filled(위험 시 #E52012) */}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-[51px] flex-1 rounded-[15px] bg-button-neutral-default-bg text-button-m text-button-neutral-default-text"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              "h-[51px] flex-1 rounded-[15px] text-button-m text-button-filled-default-text",
              destructive
                ? "bg-confirm-dialog-destructive-button-bg"
                : "bg-button-filled-default-bg",
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
