"use client";

import { useState } from "react";

/**
 * 남은 초가 바뀔 때마다 살짝 부풀었다 돌아오는 클래스 — 상세 배지·리스트 남은 시간 줄 공통.
 *
 * 같은 모양의 키프레임 두 이름을 초마다 번갈아 돌려준다. 이름이 바뀌어야 애니메이션이 처음부터
 * 다시 재생되는데, key로 다시 마운트하면 안에 든 숫자 굴림까지 끊기기 때문이다.
 * 마운트 때(첫 초)와 null(마감·파싱 실패)일 때는 움직이지 않는다.
 */
export function useTickBump(remainMs: number | null): string | undefined {
  const second = remainMs === null ? null : Math.floor(remainMs / 1000);
  const [firstSecond] = useState(second);
  if (second === null || second === firstSecond) return undefined;
  return second % 2 === 0
    ? "motion-safe:animate-tick-bump"
    : "motion-safe:animate-tick-bump-alt";
}
