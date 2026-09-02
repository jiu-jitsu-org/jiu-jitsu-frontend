"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 관찰 대상이 화면 위로 완전히 지나갔는지.
 *
 * 밸런스 게임 sticky 바의 노출 조건이다. 풀 카드에 ref를 걸면, 카드가 **완전히** 화면 밖으로
 * 나간 순간 true가 되고 다시 조금이라도 보이면 false로 돌아온다.
 *
 * WHY 위로 지나간 것만 세는가: IntersectionObserver는 "안 보임"만 알려줄 뿐 어느 방향인지는
 * 말해주지 않는다. 아래쪽에 있어서 안 보이는 경우(초기 렌더에서 카드가 접힘 아래에 있거나,
 * 빈 피드에서 레이아웃이 짧을 때)까지 true가 되면 아직 지나가지도 않은 카드의 sticky가 뜬다.
 * boundingClientRect.top이 음수일 때만 "위로 지나갔다"고 판정한다.
 *
 * enabled=false면 관찰 자체를 걸지 않는다 — 이미 투표한 사용자에게는 sticky가 없으므로
 * 스크롤 내내 관찰할 이유가 없다. 이때 반환값도 항상 false다(관찰을 멈춘 시점의 옛 값이
 * 남지 않도록 state가 아니라 파생값으로 낸다).
 */
export function useStickyReveal<T extends Element = HTMLDivElement>({
  enabled = true,
}: { enabled?: boolean } = {}) {
  const targetRef = useRef<T | null>(null);
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const el = targetRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        setPassed(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      // threshold 0 = "한 픽셀이라도 보이면 교차". 그 반대가 곧 "완전히 벗어남"이다.
      { threshold: 0 },
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, [enabled]);

  // 꺼져 있는 동안에는 마지막 관찰값을 흘리지 않는다.
  return { targetRef, passed: enabled && passed };
}
