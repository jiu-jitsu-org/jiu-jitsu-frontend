"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 숫자를 목표값까지 굴려 올리는(내리는) 표시값 — 투표율이 0%에서 63%로 "차오르게" 한다.
 *
 * animate가 false면 굴리지 않고 목표값을 그대로 낸다. 화면에 들어오자마자(이미 투표한 상세를
 * 열었을 때) 숫자가 굴러가면 사용자가 한 일도 없는데 화면이 움직이는 셈이라, 굴리는 것은
 * 사용자 동작 직후뿐이다(판단은 호출부가 한다).
 *
 * 굴리는 도중 목표가 바뀌면(A → B 연타) 지금 보이는 값에서 새 목표로 이어 간다 — 처음부터
 * 다시 세면 숫자가 뒤로 튄다.
 */
export function useCountUp(
  target: number,
  { animate, durationMs }: { animate: boolean; durationMs: number },
): number {
  const [shown, setShown] = useState(target);

  // 굴리지 않는 동안에는 목표를 그대로 따라간다(렌더 중 보정 — 이펙트를 한 번 더 돌리지 않는다).
  if (!animate && shown !== target) setShown(target);

  // 다음 애니메이션의 출발점. 렌더 중에는 ref를 쓰지 않으므로 커밋 뒤에 옮겨 둔다.
  const shownRef = useRef(shown);
  useEffect(() => {
    shownRef.current = shown;
  });

  useEffect(() => {
    if (!animate) return;

    const from = shownRef.current;
    if (from === target) return;

    // 모션 줄이기 설정이면 첫 프레임에 바로 목표로 간다.
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? 0
      : durationMs;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
      // ease-out cubic — 빨리 올라가다 목표 근처에서 느려져 마지막 숫자가 읽힌다.
      const eased = 1 - (1 - progress) ** 3;
      setShown(Math.round(from + (target - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, animate, durationMs]);

  return shown;
}
