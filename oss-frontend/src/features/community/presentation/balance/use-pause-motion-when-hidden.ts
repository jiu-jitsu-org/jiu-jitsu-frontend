"use client";

import { useEffect, useRef } from "react";

/**
 * 요소가 화면 밖이거나 탭·앱이 가려지면 `data-motion-paused`를 붙인다(#317).
 *
 * 밸런스 판은 스크롤로 벗어나도 마운트된 채 남아 대결 동작이 계속 돈다. 멈추는 일은 CSS가 하고
 * (`animation-play-state`), 여기서는 속성만 바꾼다 — 상태로 두면 스크롤할 때마다 판 전체가 다시 렌더된다.
 * 멈췄던 자리에서 이어 돌아 다시 보여도 박자가 튀지 않는다.
 */
export function usePauseMotionWhenHidden<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let onScreen = true;
    const apply = () => {
      element.toggleAttribute("data-motion-paused", !onScreen || document.hidden);
    };

    // 빠르게 스크롤하면 변화가 여러 개 쌓여 온다 — 마지막 것이 지금 상태다.
    const observer = new IntersectionObserver((entries) => {
      onScreen = entries[entries.length - 1].isIntersecting;
      apply();
    });
    observer.observe(element);
    document.addEventListener("visibilitychange", apply);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", apply);
    };
  }, []);

  return ref;
}
