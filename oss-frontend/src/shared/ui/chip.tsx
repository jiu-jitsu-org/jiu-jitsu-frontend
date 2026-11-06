import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * 칩 — 고르면 켜지는 둥근 버튼. 커뮤니티 글쓰기 카테고리(#303)와 대회 목록 필터(#334)가 같이 쓴다.
 *
 * 디자인(2026-09-16): 높이 32 · 좌우 12 · Button S. 비선택 = 투명 + 1px chip/default/border,
 * 선택 = chip/selected/bg + 1px chip/selected/border. 글자는 둘 다 chip/default/text.
 * 누르는 동안 96%로 눌렸다가 놓으면 스프링으로 돌아온다(PRESS_BOUNCE와 같은 값).
 *
 * `invalid`는 필수 선택을 비워 둔 채 제출했을 때 비선택 칩 테두리를 오류 색으로 바꾼다.
 * 켜짐 상태를 화면 읽기 도구에 알리는 aria-pressed는 호출부가 붙인다 — 시트를 여는 칩은 토글이 아니다.
 */
export function Chip({
  selected,
  invalid = false,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  selected: boolean;
  invalid?: boolean;
}) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-button-s text-tag-chip-default-text transition-colors",
        selected
          ? "border-chip-selected-border bg-tag-chip-selected-bg"
          : cn(
              "bg-tag-chip-default-bg",
              // chip 전용 오류 토큰이 없어 semantic(border/error)을 쓴다.
              invalid ? "border-border-error" : "border-chip-default-border",
              // 눌림 면은 비선택 칩에만 — 선택 칩은 제 바탕(chip/selected)을 그대로 지킨다.
              "not-disabled:active:bg-surface-container-pressed",
            ),
        "disabled:text-tag-chip-disabled-text",
        // transition 속성 하나에 색·크기를 함께 적는다 — 따로 걸면 transition-property가 서로 덮어쓴다.
        "motion-safe:[transition:scale_500ms_var(--ease-spring-wobbly),background-color_120ms_ease-out,border-color_120ms_ease-out]",
        "motion-safe:not-disabled:active:[transition:scale_100ms_ease-out,background-color_120ms_ease-out,border-color_120ms_ease-out]",
        "motion-safe:not-disabled:active:scale-96",
        className,
      )}
      {...props}
    />
  );
}
