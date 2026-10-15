"use client";

import {
  createContext,
  use,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { prefersReducedMotion } from "@/features/community/presentation/use-presence-motion";
import { cn } from "@/shared/lib/cn";
import { SURFACE_PRESS } from "@/shared/ui/press-styles";

/** 닫힐 때 미끄러져 들어가는 시간(ms) — motion.css의 menu-slide-out과 같은 값. */
const MENU_SLIDE_OUT_MS = 200;

/**
 * 항목을 고르는 길 — 항목 동작은 바로 부르고, 메뉴는 미끄러져 들어간 뒤 닫는다.
 * 항목(MenuItem)이 이 길로 닫혀야 해서 컨텍스트로 내려준다.
 */
const MenuSelectContext = createContext<((action: () => void) => void) | null>(
  null,
);

/** 트리거 기준 메뉴 위치. bottom=아래로 드롭, top=위로(붙여서). */
type MenuPlacement = "bottom-left" | "bottom-right" | "top-right";

// --menu-shift는 열릴 때 출발점 — 트리거 쪽에서 8px 떨어진 곳부터 미끄러져 나온다.
const PLACEMENT_CLASS: Record<MenuPlacement, string> = {
  "bottom-left": "top-full left-0 mt-1 [--menu-shift:-8px]",
  "bottom-right": "top-full right-0 mt-1 [--menu-shift:-8px]",
  // 버튼 top에 붙여 위로
  "top-right": "bottom-full right-0 [--menu-shift:8px]",
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
  // 닫힘은 호출부가 open을 끄는 순간 언마운트라 그 전에 여기서 나가는 애니메이션을 먼저 돌린다.
  // 바깥 클릭이든 항목 선택이든 미끄러져 들어간 뒤(200ms) onClose만 부른다 — 항목 동작은 누른
  // 즉시 실행해 알럿·이동이 메뉴 애니메이션을 기다리지 않게 한다. 그래서 호출부의 항목 동작에서는
  // open을 끄지 않는다(끄면 바로 언마운트돼 나가는 애니메이션이 없다).
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);
  const closeTimer = useRef<number | undefined>(undefined);

  // 동작이 화면을 바꿔 먼저 언마운트되면 닫을 메뉴도 없으니 남은 onClose는 버린다.
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  function leave() {
    if (leavingRef.current) return;
    leavingRef.current = true;
    // 움직임 줄이기 설정이면 기다리지 않고 바로 닫는다.
    if (prefersReducedMotion()) {
      onClose();
      return;
    }
    setLeaving(true);
    closeTimer.current = window.setTimeout(onClose, MENU_SLIDE_OUT_MS);
  }

  function select(action: () => void) {
    // 나가는 중에 한 번 더 눌러 동작이 두 번 실행되지 않게 막는다.
    if (leavingRef.current) return;
    action();
    leave();
  }

  return (
    <MenuSelectContext value={select}>
      {/* 바깥 클릭으로 닫기 위한 투명 백드롭 — 나가는 동안에도 남겨 아래를 누르지 못하게 한다. */}
      <button
        type="button"
        aria-label="메뉴 닫기"
        onClick={leave}
        className="fixed inset-0 z-10 cursor-default"
      />
      <ul
        role={role}
        aria-label={ariaLabel}
        className={cn(
          "absolute z-20 flex w-[140px] flex-col overflow-hidden rounded-2xl border border-[var(--cool-gray-50)] bg-list-setting-background py-1",
          leaving
            ? "pointer-events-none motion-safe:animate-menu-slide-out"
            : "motion-safe:animate-menu-slide-in",
          PLACEMENT_CLASS[placement],
        )}
      >
        {children}
      </ul>
    </MenuSelectContext>
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
  // MenuBox 밖에서 쓰이면(컨텍스트 없음) 그대로 바로 부른다.
  const select = use(MenuSelectContext);

  return (
    <li role={role} aria-selected={role === "option" ? selected : undefined}>
      <button
        type="button"
        onClick={() => (select ? select(onClick) : onClick())}
        className={cn(
          "flex h-[41px] w-full items-center px-4 text-body-s text-list-setting-text",
          SURFACE_PRESS,
        )}
      >
        {children}
      </button>
    </li>
  );
}
