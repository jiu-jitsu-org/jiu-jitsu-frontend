"use client";

import { useEffect, useState } from "react";

import { cn } from "@/shared/lib/cn";
import type { SelectSheetOption } from "@/shared/lib/native-bridge";

const SHEET_FADE_MS = 200;

/**
 * 선택 바텀시트 — **웹 단독 실행용 폴백**.
 *
 * 앱에서는 네이티브가 같은 역할의 시트를 그린다(GNB·탭바까지 덮는 딤이 필요해서).
 * 이 컴포넌트는 브라우저 개발/데모에서 플로우가 끊기지 않게 하는 용도지만, 네이티브 구현의 기준이
 * 되도록 디자인(핸들바·라디오·기타 입력·하단 CTA)과 토큰을 그대로 맞춘다.
 *
 * 여는 상태/콜백은 호출부가 소유한다(controlled) — ConfirmDialog와 동일 철학.
 */
export function SelectSheet({
  open,
  title,
  message,
  options,
  customTextPlaceholder,
  submitText,
  onDismiss,
  onSubmit,
}: {
  open: boolean;
  title: string;
  message?: string;
  options: SelectSheetOption[];
  customTextPlaceholder?: string;
  submitText: string;
  onDismiss: () => void;
  onSubmit: (selected: { value: string; customText?: string }) => void;
}) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");

  // 알럿과 동일한 페이드 처리(열릴 때 한 프레임 뒤 전환 / 닫힐 때 페이드 아웃 후 언마운트).
  useEffect(() => {
    if (!open) {
      const raf = requestAnimationFrame(() => setVisible(false));
      const timer = setTimeout(() => setMounted(false), SHEET_FADE_MS);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    }

    // 선택 상태 초기화는 따로 하지 않는다 — 호출부(useNativeDialog)가 닫힌 뒤 시트를 언마운트하므로
    // 다시 열릴 때는 항상 새 인스턴스로 시작한다.
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

  const selectedOption = options.find((option) => option.value === selected);
  const needsCustomText = selectedOption?.allowsCustomText === true;
  // 자유 입력 항목은 내용이 있어야 제출할 수 있다(빈 사유 전송 방지 — BFF도 400으로 막는다).
  const canSubmit =
    selectedOption !== undefined &&
    (!needsCustomText || customText.trim().length > 0);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-end transition-opacity duration-200",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      {/* 딤(바깥 탭 시 닫기) — 웹뷰 영역까지만 덮이는 건 웹 폴백의 한계다(앱에서는 네이티브가 그린다). */}
      <button
        type="button"
        aria-label="닫기"
        onClick={onDismiss}
        className="absolute inset-0 bg-bottom-sheet-selected-container-scrim"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full rounded-t-[20px] bg-bottom-sheet-selected-container-background px-5 pb-5"
      >
        {/* 핸들바: 상단 여백 8, 폭 40 높이 4 */}
        <div className="flex justify-center pt-2">
          <span className="h-1 w-10 rounded-full bg-bottom-sheet-selected-container-handle" />
        </div>

        {/* 제목: Title2(Semibold 20) */}
        <h2 className="mt-4 text-left text-xl font-semibold text-bottom-sheet-selected-container-title">
          {title}
        </h2>
        {message ? (
          // 보조 설명: Body S(14/21)
          <p className="mt-1 text-left text-sm leading-[21px] text-text-secondary">
            {message}
          </p>
        ) : null}

        <ul className="mt-4 flex flex-col" role="radiogroup" aria-label={title}>
          {options.map((option) => (
            <SheetOption
              key={option.value}
              label={option.label}
              selected={selected === option.value}
              onSelect={() => setSelected(option.value)}
            />
          ))}
        </ul>

        {needsCustomText ? (
          <textarea
            value={customText}
            onChange={(event) => setCustomText(event.target.value)}
            placeholder={customTextPlaceholder}
            className="mt-2 h-20 w-full resize-none rounded-[15px] bg-textfield-mutiline-default-bg px-4 py-3 text-sm text-textfield-mutiline-filled-text placeholder:text-textfield-mutiline-default-text"
          />
        ) : null}

        {/* 하단 CTA: 높이 51, radius 15 — 앱 공통 버튼 스펙과 동일 */}
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() =>
            selectedOption
              ? onSubmit({
                  value: selectedOption.value,
                  customText: needsCustomText ? customText.trim() : undefined,
                })
              : undefined
          }
          className="mt-4 h-[51px] w-full rounded-[15px] bg-cta-primary-bg text-base font-semibold text-cta-primary-text disabled:bg-cta-primary-disabled-bg disabled:text-cta-primary-disabled-text"
        >
          {submitText}
        </button>
      </div>
    </div>
  );
}

/** 시트 단일 항목 — 높이 51, 좌측 라디오 20x20 + 라벨. */
function SheetOption({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={onSelect}
        className="flex h-[51px] w-full items-center gap-3 text-left"
      >
        <span
          className={cn(
            "inline-flex size-5 shrink-0 items-center justify-center rounded-full border",
            selected
              ? "border-radio-selected-border bg-radio-selected-bg"
              : "border-radio-unselected-border bg-radio-unselected-bg",
          )}
        >
          {selected ? (
            <span className="size-2.5 rounded-full bg-radio-selected-dot" />
          ) : null}
        </span>
        <span
          className={cn(
            "text-base",
            selected
              ? "font-medium text-bottom-sheet-selected-list-item-label"
              : "font-medium text-bottom-sheet-unselected-list-item-label",
          )}
        >
          {label}
        </span>
      </button>
    </li>
  );
}
