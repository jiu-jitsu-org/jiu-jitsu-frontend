"use client";

import { useId, useLayoutEffect, useRef, type KeyboardEvent } from "react";

import { cn } from "@/shared/lib/cn";

/** 앱 휠(SheetPickerView, standard)과 같은 칸: 높이 45 · 사이 8 · 보이는 칸 3. */
const ITEM_HEIGHT = 45;
const ITEM_GAP = 8;
const PITCH = ITEM_HEIGHT + ITEM_GAP;
/** 3칸 + 사이 2 = 151. */
const VIEWPORT_HEIGHT = ITEM_HEIGHT * 3 + ITEM_GAP * 2;

/**
 * 세로 휠 피커 (#300) — 앱 바텀시트의 휠(iOS SheetPickerView, standard 스타일)을 웹으로 옮겼다.
 *
 * 세 칸이 보이고 가운데 칸이 고른 값이다. 위아래로 굴리면 가운데에 온 값이 그 자리에서 바로 onChange로 간다
 * (손을 떼기 전에도) — 위쪽 미리보기가 굴리는 대로 따라 바뀌게. 칸을 누르면 그 칸이 가운데로 굴러온다.
 * 멈출 때는 scroll-snap으로 항상 칸이 가운데에 딱 맞는다 — 두 휠을 나란히 둬도 줄이 어긋나지 않는다.
 *
 * 모양: 가운데 칸만 picker/item-selected 면(radius 10)과 글자 24, 나머지는 옅은 글자 20(둘 다 Medium).
 * 처음 뜰 때 value 칸을 가운데에 둔다. 열 때마다 새로 마운트되는 시트 안에서 쓴다.
 */
export function WheelPicker<T extends string | number>({
  label,
  items,
  value,
  getLabel,
  onChange,
  className,
}: {
  /** 스크린리더 이름(화면에는 안 보임). */
  label: string;
  items: readonly T[];
  value: T;
  getLabel: (item: T) => string;
  onChange: (item: T) => void;
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const idPrefix = useId();
  const selectedIndex = Math.max(0, items.indexOf(value));

  // 처음 뜰 때만 value 칸을 가운데로(애니메이션 없이). 이후엔 굴린 위치가 곧 값이라 되감지 않는다.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = selectedIndex * PITCH;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 마운트 때 한 번만
  }, []);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const index = Math.min(items.length - 1, Math.max(0, Math.round(el.scrollTop / PITCH)));
    if (items[index] !== value) onChange(items[index]);
  }

  function scrollToIndex(index: number) {
    // '동작 줄이기'면 굴러가지 않고 바로 그 칸으로.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scrollRef.current?.scrollTo({ top: index * PITCH, behavior: reduce ? "auto" : "smooth" });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    scrollToIndex(Math.min(items.length - 1, Math.max(0, selectedIndex + step)));
  }

  return (
    <div
      ref={scrollRef}
      role="listbox"
      aria-label={label}
      aria-activedescendant={`${idPrefix}-${String(value)}`}
      tabIndex={0}
      onScroll={handleScroll}
      onKeyDown={handleKeyDown}
      // 위아래 여백 = 한 칸(45+8)이라 첫 칸·끝 칸도 가운데까지 굴러온다. 스크롤바는 숨긴다.
      // overscroll-contain: 휠 끝에서 더 굴려도 시트·뒤 화면이 따라 움직이지 않게.
      className={cn(
        "w-[130px] snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-[10px] outline-none",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "focus-visible:ring-2 focus-visible:ring-chip-selected-border",
        className,
      )}
      style={{ height: VIEWPORT_HEIGHT, paddingBlock: PITCH }}
    >
      <div className="flex flex-col" style={{ gap: ITEM_GAP }}>
        {items.map((item, index) => {
          const selected = index === selectedIndex;
          return (
            <div
              key={String(item)}
              id={`${idPrefix}-${String(item)}`}
              role="option"
              aria-selected={selected}
              onClick={() => scrollToIndex(index)}
              className={cn(
                "flex shrink-0 cursor-pointer snap-center items-center justify-center rounded-[10px] font-medium",
                "transition-[background-color,color,font-size] duration-150 ease-out",
                selected
                  ? "bg-picker-item-selected-bg text-[24px] text-picker-item-selected-text"
                  : "text-[20px] text-picker-item-unselected-text",
              )}
              style={{ height: ITEM_HEIGHT }}
            >
              {getLabel(item)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
