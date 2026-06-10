"use client";

import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

/** 트리거 기준 메뉴 위치. bottom=아래로 드롭, top=위로(붙여서). */
type MenuPlacement = "bottom-left" | "bottom-right" | "top-right";

const PLACEMENT_CLASS: Record<MenuPlacement, string> = {
  "bottom-left": "top-full left-0 mt-1",
  "bottom-right": "top-full right-0 mt-1",
  // 버튼 top에 붙여 위로
  "top-right": "bottom-full right-0",
};

/**
 * 드롭다운 메뉴 박스 (정렬·댓글·헤더 공통).
 *
 * 통일 디자인: 너비 140, fill list/setting/background, stroke CoolGray/50(inside 1px), radius 16,
 * 상하 여백 4(py-1), 아이템 간격 0, 좌우 여백 없음, shadow 없음. 바깥 클릭 닫기 백드롭 포함.
 *
 * 여는 상태와 트리거는 호출부가 소유한다 → 열렸을 때 `relative` 래퍼 안에서 이 컴포넌트를 렌더한다.
 */
export function MenuBox({
  placement,
  role = "menu",
  ariaLabel,
  onClose,
  children,
}: {
  placement: MenuPlacement;
  role?: "menu" | "listbox";
  ariaLabel?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <>
      {/* 바깥 클릭으로 닫기 위한 투명 백드롭 */}
      <button
        type="button"
        aria-label="메뉴 닫기"
        onClick={onClose}
        className="fixed inset-0 z-10 cursor-default"
      />
      <ul
        role={role}
        aria-label={ariaLabel}
        className={cn(
          "absolute z-20 flex w-[140px] flex-col overflow-hidden rounded-2xl border border-[var(--cool-gray-50)] bg-list-setting-background py-1",
          PLACEMENT_CLASS[placement],
        )}
      >
        {children}
      </ul>
    </>
  );
}

/**
 * 메뉴 단일 항목 — 높이 41, Body S(14/21), 색 list/setting/text.
 * 정렬 메뉴는 role="option"(+selected)로, 일반 메뉴는 기본 role="menuitem"로 쓴다.
 */
export function MenuItem({
  children,
  onClick,
  role = "menuitem",
  selected,
}: {
  children: ReactNode;
  onClick: () => void;
  role?: "menuitem" | "option";
  selected?: boolean;
}) {
  return (
    <li role={role} aria-selected={role === "option" ? selected : undefined}>
      <button
        type="button"
        onClick={onClick}
        className="flex h-[41px] w-full items-center px-4 text-sm leading-[21px] text-list-setting-text"
      >
        {children}
      </button>
    </li>
  );
}
