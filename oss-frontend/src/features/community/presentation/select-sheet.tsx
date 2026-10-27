"use client";

import { useState } from "react";

import { BottomSheetFrame } from "@/features/community/presentation/bottom-sheet-frame";
import { cn } from "@/shared/lib/cn";
import type { SelectSheetOption } from "@/shared/lib/native-bridge";
import { PRESS_BOUNCE, SURFACE_PRESS } from "@/shared/ui/press-styles";

/**
 * 선택 바텀시트 — **웹 단독 실행용 폴백**.
 *
 * 앱에서는 네이티브가 같은 역할의 시트를 그린다(GNB·탭바까지 덮는 딤이 필요해서).
 * 이 컴포넌트는 브라우저 개발/데모에서 플로우가 끊기지 않게 하는 용도지만, 네이티브 구현의 기준이
 * 되도록 디자인(핸들바·라디오·기타 입력·하단 CTA)과 토큰을 그대로 맞춘다.
 *
 * 여는 상태/콜백은 호출부가 소유한다(controlled) — ConfirmDialog와 동일 철학.
 * 딤·핸들바·제목·올라오는 전환은 BottomSheetFrame이 맡는다.
 */
export function SelectSheet({
  open,
  title,
  message,
  options,
  customTextPlaceholder,
  customTextMaxLength,
  submitText,
  onDismiss,
  onSubmit,
}: {
  open: boolean;
  title: string;
  message?: string;
  options: SelectSheetOption[];
  customTextPlaceholder?: string;
  /** 자유 입력 최대 글자 수. 넘는 입력·붙여넣기는 브라우저가 잘라낸다(글자 수 표시는 네이티브와 맞춰 두지 않는다). */
  customTextMaxLength?: number;
  submitText: string;
  onDismiss: () => void;
  onSubmit: (selected: { value: string; customText?: string }) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");

  // 선택 상태 초기화는 따로 하지 않는다 — 호출부(useNativeDialog)가 닫힌 뒤 시트를 언마운트하므로
  // 다시 열릴 때는 항상 새 인스턴스로 시작한다.
  const selectedOption = options.find((option) => option.value === selected);
  const needsCustomText = selectedOption?.allowsCustomText === true;
  // 자유 입력은 선택 사항이다 — 「기타」를 고르기만 해도 제출할 수 있다. 사유를 글로 설명하기
  // 어려운 사용자가 「기타」로 신고할 길이 막히면 안 된다. 전송값은 reason 코드라 입력이 비어도
  // BFF 검증(reason 필수)에 걸리지 않는다.
  const canSubmit = selectedOption !== undefined;

  return (
    <BottomSheetFrame
      open={open}
      title={title}
      message={message}
      onDismiss={onDismiss}
    >
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
          maxLength={customTextMaxLength}
          className="mt-2 h-20 w-full resize-none rounded-[15px] bg-textfield-mutiline-default-bg px-4 py-3 text-body-s text-textfield-mutiline-filled-text placeholder:text-textfield-mutiline-default-text"
        />
      ) : null}

      {/* 하단 CTA: 높이 51, radius 15 — 앱 공통 버튼 스펙과 동일.
          누르는 동안 cta 눌림 색이 깔리고 살짝 눌렸다 출렁인다(고르기 전 비활성일 때는 반응하지 않는다). */}
      <button
        type="button"
        disabled={!canSubmit}
        onClick={() =>
          selectedOption
            ? onSubmit({
                value: selectedOption.value,
                // 비어 있으면 빈 문자열 대신 아예 싣지 않는다(입력 안 함 == 없음).
                customText:
                  needsCustomText && customText.trim()
                    ? customText.trim()
                    : undefined,
              })
            : undefined
        }
        className={cn(
          "mt-4 h-[51px] w-full rounded-[15px] bg-cta-primary-bg text-button-m text-cta-primary-text disabled:bg-cta-primary-disabled-bg disabled:text-cta-primary-disabled-text",
          "enabled:active:bg-cta-primary-pressed-bg",
          PRESS_BOUNCE,
        )}
      >
        {submitText}
      </button>
    </BottomSheetFrame>
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
        // 누르는 동안 줄 바탕이 옅게 물든다. 면이 시트 좌우 끝(px-5)까지 닿도록 여백을 음수 마진으로 넓힌다.
        className={cn(
          "-mx-5 flex h-[51px] w-[calc(100%+2.5rem)] items-center gap-3 px-5 text-left",
          SURFACE_PRESS,
        )}
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
            "text-body-m",
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
