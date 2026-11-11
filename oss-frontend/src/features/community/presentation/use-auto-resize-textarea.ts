"use client";

import { useLayoutEffect, useRef } from "react";

/** 입력 중인 줄 아래로 남겨 둘 여백(px) — 커서가 화면 바닥(=키보드 위 툴바)에 딱 붙지 않게. */
const CARET_BOTTOM_GAP = 24;

/** 가장 가까운 세로 스크롤 조상(작성 화면에선 main). 없으면 null. */
function findScrollParent(element: HTMLElement): HTMLElement | null {
  let node = element.parentElement;
  while (node) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") return node;
    node = node.parentElement;
  }
  return null;
}

/**
 * 내용 길이에 맞춰 높이가 자라는 textarea (자체 스크롤 없음).
 *
 * 작성 화면은 제목·본문이 한 흐름으로 이어져 화면 전체(main)가 스크롤되는 디자인이라, textarea 내부
 * 스크롤이 생기면 "본문 안에서 또 스크롤"이 돼 손가락 제스처가 충돌한다. `field-sizing: content`는
 * WKWebView 미지원이라 값이 바뀔 때마다 scrollHeight로 높이를 다시 잰다.
 *
 * useLayoutEffect — 높이를 잰 뒤 그리므로 한 프레임 깜빡임(이전 높이 → 새 높이) 없이 갱신된다.
 *
 * 긴 본문 스크롤 튐(#397): 다시 재려고 높이를 auto(한 줄)로 접는 순간 스크롤 칸 전체가 짧아져 브라우저가
 * 스크롤 위치를 위로 깎는다. 높이를 되돌려도 깎인 위치는 그대로라 글자를 칠 때마다 화면이 위로 튀고, 쓰던
 * 줄은 키보드 뒤로 내려가 "스크롤이 안 먹는" 것처럼 보였다. 접기 전 위치를 기억해 되돌리고, 끝에 이어 쓰는
 * 중이면 쓰는 줄이 보이도록 그만큼만 내려 준다.
 */
export function useAutoResizeTextarea(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const scroller = findScrollParent(element);
    const savedScrollTop = scroller?.scrollTop ?? 0;
    // auto로 한 번 접어야 줄이 줄었을 때(삭제)도 scrollHeight가 실제 내용 높이로 다시 계산된다.
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
    if (!scroller) return;
    // 깎였을 때만 되돌린다 — 관성 스크롤 중에 같은 값을 다시 써서 움직임을 끊지 않게.
    if (scroller.scrollTop !== savedScrollTop) scroller.scrollTop = savedScrollTop;

    // 끝에 이어 쓰는 중(커서가 맨 끝)이면 칸의 아랫단이 스크롤 칸 안에 보이게 한다. 중간을 고칠 때는 건드리지 않는다.
    const typingAtEnd =
      document.activeElement === element &&
      element.selectionEnd === element.value.length;
    if (!typingAtEnd) return;
    const overflow =
      element.getBoundingClientRect().bottom -
      (scroller.getBoundingClientRect().bottom - CARET_BOTTOM_GAP);
    if (overflow > 0) scroller.scrollTop += overflow;
  }, [value]);

  return ref;
}
