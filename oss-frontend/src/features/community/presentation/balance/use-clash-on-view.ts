"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 한 판의 길이 — motion.css balance-clash-*가 끝나는 시각(가장 긴 A 눈동자 3.5초)에 여유를 조금 둔다.
 * 이보다 일찍 끄면 덜 돈 동작이 제자리로 튄다.
 */
const CLASH_MS = 3600;

/**
 * 홈 카드의 대결을 "화면에 들어올 때마다 한 판씩" 튼다.
 *
 * 카드에 ref를 걸면, 카드가 화면에 충분히(60%) 들어온 순간 clashing이 true가 되고 한 판 길이가 지나면
 * false로 돌아온다. 선택지는 clashing 동안만 한 판 동작 클래스를 달고, 클래스가 다시 붙을 때마다
 * 애니메이션이 처음부터 돈다 — 스크롤로 지나쳤다 돌아오면 또 한 판, 머물러 있으면 쉰다.
 *
 * WHY 끝없이 돌리지 않는가: 피드 맨 위라 하루에도 여러 번 지나친다. 볼 때마다 계속 움직이면 금세
 * 피로해지고, 정작 "골랐다"는 순간이 묻힌다(BalanceClash 주석).
 *
 * phase가 바뀌면(투표 전 → 고른 뒤, 취소·변경) 돌던 한 판을 바로 끊고 다음에 화면에 들어올 때까지
 * 쉰다. 고르는 순간에는 그 한 동작(발밑에서 차오름)만 보여야 하고, 한 판이 겹치면 산만해진다.
 * 관찰을 다시 걸지 않는 이유도 같다 — 다시 걸면 보이는 중인 카드가 곧바로 또 한 판을 튼다.
 *
 * enabled=false면 관찰하지 않는다 — 마감된 판은 대결할 이유가 없다. 반환값도 항상 false다
 * (useStickyReveal과 같은 이유로 state가 아니라 파생값으로 낸다).
 */
export function useClashOnView<T extends Element = HTMLElement>({
  enabled = true,
  phase,
}: { enabled?: boolean; phase?: string } = {}) {
  const targetRef = useRef<T | null>(null);
  // 어느 phase에 튼 한 판인지 함께 들고 있어, phase가 바뀌면 파생값이 바로 false가 된다.
  const [clash, setClash] = useState<{ on: boolean; phase?: string }>({
    on: false,
  });
  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (!enabled) return;

    const el = targetRef.current;
    if (!el) return;

    let timer: number | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;

        setClash({ on: true, phase: phaseRef.current });
        window.clearTimeout(timer);
        timer = window.setTimeout(() => setClash({ on: false }), CLASH_MS);
      },
      { threshold: 0.6 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [enabled]);

  return {
    targetRef,
    clashing: enabled && clash.on && clash.phase === phase,
  };
}
