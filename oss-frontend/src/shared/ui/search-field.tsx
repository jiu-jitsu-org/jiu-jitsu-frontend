"use client";

import { useRef, type InputHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

import { ClearIcon, SearchIcon } from "./icons";

/**
 * 검색칸 — 돋보기 + 입력 + 지우기(×). 대회 이름 검색(#345)이 처음 쓴다.
 *
 * 폰 브라우저 기본 검색칸 모양을 다 걷어내고 앱 모양만 남긴다:
 * - iOS의 안쪽 둥근 회색 면·그림자(`appearance`)와 기본 돋보기·×를 없앤다.
 * - 글자는 16px — 16보다 작으면 iOS가 입력할 때 화면을 확대해 버린다.
 * - 높이 40 · 모서리 10 · 평소엔 회색 면만(테두리 없음). 입력 중엔 밝은 면 + 파랑 테두리 2(입력칸 공통 포커스 색). 지우기는 글자가 있을 때만.
 * 엔터는 키보드만 내리고, Esc는 `onEscape`(보통 닫기)를 부른다. 한글 조합 중의 키는 조합을 끝내는 데 쓰여 무시한다.
 */
export function SearchField({
  value,
  onValueChange,
  onEscape,
  onKeyDown,
  className,
  ...props
}: Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type" | "children"
> & {
  value: string;
  onValueChange: (value: string) => void;
  onEscape?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <label
      className={cn(
        "flex h-10 items-center gap-2 rounded-10 bg-surface-secondary pr-1 pl-3",
        // 입력 중 — 입력칸 공통 '포커스' 색: 바탕이 한 단계 밝아지고 파랑 테두리 2. 안쪽에 그려 크기가 변하지 않는다.
        "focus-within:bg-textfield-focused-bg focus-within:ring-2 focus-within:ring-textfield-focused-border focus-within:ring-inset",
        className,
      )}
    >
      <SearchIcon size={18} className="flex-none text-icon-secondary" />
      <input
        ref={inputRef}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        {...props}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.nativeEvent.isComposing) return;
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") onEscape?.();
        }}
        className={cn(
          "h-full min-w-0 flex-1 appearance-none rounded-none bg-transparent text-[16px] leading-[22px] text-text-primary caret-primary outline-none",
          "placeholder:text-textfield-default-placeholder",
          "[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
        )}
      />
      {value ? (
        <button
          type="button"
          aria-label="검색어 지우기"
          onClick={() => {
            onValueChange("");
            inputRef.current?.focus();
          }}
          // 보이는 동그라미는 20, 누를 자리는 32.
          className="group flex size-8 flex-none items-center justify-center rounded-full"
        >
          <ClearIcon
            size={20}
            className="text-icon-disabled group-active:text-icon-tertiary"
          />
        </button>
      ) : null}
    </label>
  );
}
