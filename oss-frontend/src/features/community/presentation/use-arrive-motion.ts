"use client";

import { useLayoutEffect, useRef } from "react";

// 데이터는 응답이 오는 즉시 넣고 일부러 쉬지 않는다. 처음에 확 펼쳐지는 곡선 대신 고른 곡선으로,
// 아래에서 조금 올라오며 펼쳐져 '올라갔다'는 움직임이 눈에 보이게 한다(앱 공통 모션 500ms).
const GROW_MS = 500;
const GLOW_MS = 1600;
const RISE_PX = 12;

/**
 * 방금 등록한 댓글이 목록에 나타날 때 — 자리가 펼쳐지며 아래에서 올라오고, 옅은 파란 면이 잠깐 머물다 빠진다.
 *
 * 높이 auto로는 CSS 키프레임을 못 걸어 마운트 직후 실제 높이를 재서 Web Animations로 돌린다.
 * 면은 레이아웃을 건드리지 않게 배경 + 같은 색 box-shadow로 8px 바깥까지 넓혀 칠한다.
 * 마운트 때 active일 때만 한 번 재생한다(목록이 다시 그려져도 같은 행은 재마운트되지 않는다).
 */
export function useArriveMotion<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!active || !el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const height = el.offsetHeight;
    const glow = "var(--surface-primary-subtle)";
    const clear = "transparent";
    const grow = el.animate(
      [
        {
          height: "0px",
          opacity: 0,
          transform: `translateY(${RISE_PX}px)`,
          overflow: "hidden",
        },
        {
          height: `${height}px`,
          opacity: 1,
          transform: "translateY(0)",
          overflow: "hidden",
        },
      ],
      { duration: GROW_MS, easing: "cubic-bezier(0.25, 0.1, 0.25, 1)" },
    );
    const shine = el.animate(
      [
        { backgroundColor: glow, boxShadow: `0 0 0 8px ${glow}` },
        { backgroundColor: glow, boxShadow: `0 0 0 8px ${glow}`, offset: 0.6 },
        { backgroundColor: clear, boxShadow: `0 0 0 8px ${clear}` },
      ],
      { duration: GLOW_MS },
    );
    el.style.borderRadius = "10px";

    return () => {
      grow.cancel();
      shine.cancel();
    };
    // 마운트 때 한 번만 — active가 나중에 바뀌어도 이미 있는 행은 다시 튀지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}
