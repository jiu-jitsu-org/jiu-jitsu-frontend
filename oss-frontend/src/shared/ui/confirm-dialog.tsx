"use client";

import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * 공통 확인 알럿(커스텀 다이얼로그).
 *
 * 제목 + 설명 + [취소 / 확인] 2버튼. 확인이 위험 동작이면 destructive(빨강).
 * 여는 상태/콜백은 호출부가 소유한다(controlled).
 */
export function ConfirmDialog({
  open,
  title,
  message,
  cancelText = "취소",
  confirmText,
  destructive = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: ReactNode;
  message?: ReactNode;
  cancelText?: string;
  confirmText: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    // 알럿은 디바이스 좌우 27.5 여백으로 배치(가운데), 높이는 콘텐츠에 따라 가변.
    <div className="fixed inset-0 z-50 flex items-center justify-center px-[27.5px]">
      {/* 딤 배경(바깥 탭 시 취소). overlay/scrim = 40% 블랙 반투명 → 뒤 콘텐츠가 어둡게 비친다. */}
      <button
        type="button"
        aria-label="닫기"
        onClick={onCancel}
        className="absolute inset-0 bg-overlay-scrim"
      />

      <div
        role="dialog"
        aria-modal="true"
        // 폭 = min(320, 화면폭 − 좌우 27.5). 375pt에서 정확히 320, 작은 기기는 여백 유지하며 축소,
        // 큰 기기는 320에서 상한(시스템 알럿처럼 안 커짐). 높이는 콘텐츠 가변. radius 20, 내부 여백 20.
        className="relative w-full max-w-[320px] rounded-[20px] bg-dialog-container-bg px-5 pb-5 pt-5"
      >
        {/* 제목: Title2(Pretendard Semibold 20), 색 dialog/title-text, 좌측 정렬 */}
        <h2 className="text-left text-xl font-semibold text-dialog-title-text">
          {title}
        </h2>
        {message ? (
          // 설명: Body M(16/24), 색 dialog/description-text, 좌측 정렬
          <p className="mt-2 text-left text-base font-medium leading-6 text-dialog-description-text">
            {message}
          </p>
        ) : null}

        {/* 버튼: 서브타이틀과 간격 16(mt-4), 버튼끼리 8(gap-2), 높이 51 고정, Button M, radius 15.
            취소=neutral / 확인=filled(위험 시 #E52012) */}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-[51px] flex-1 rounded-[15px] bg-button-neutral-default-bg text-base font-semibold text-button-neutral-default-text"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              "h-[51px] flex-1 rounded-[15px] text-base font-semibold text-button-filled-default-text",
              destructive ? "bg-[#E52012]" : "bg-button-filled-default-bg",
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
