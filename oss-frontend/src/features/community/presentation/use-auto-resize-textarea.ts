"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * 내용 길이에 맞춰 높이가 자라는 textarea (자체 스크롤 없음).
 *
 * 작성 화면은 제목·본문이 한 흐름으로 이어져 화면 전체(main)가 스크롤되는 디자인이라, textarea 내부
 * 스크롤이 생기면 "본문 안에서 또 스크롤"이 돼 손가락 제스처가 충돌한다. `field-sizing: content`는
 * WKWebView 미지원이라 값이 바뀔 때마다 scrollHeight로 높이를 다시 잰다.
 *
 * useLayoutEffect — 높이를 잰 뒤 그리므로 한 프레임 깜빡임(이전 높이 → 새 높이) 없이 갱신된다.
 */
export function useAutoResizeTextarea(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    // auto로 한 번 접어야 줄이 줄었을 때(삭제)도 scrollHeight가 실제 내용 높이로 다시 계산된다.
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, [value]);

  return ref;
}
