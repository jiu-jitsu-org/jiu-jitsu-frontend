"use client";

import { useState, type CSSProperties } from "react";

import { cn } from "@/shared/lib/cn";
import { TimerIcon } from "@/shared/ui/icons";

/**
 * 초마다 째깍 흔들리는 시계 아이콘 — 남은 시간 표기(상세 배지·리스트 카드·고정 바) 공통.
 *
 * 남은 초가 바뀔 때마다 key를 바꿔 다시 마운트해 모션을 처음부터 재생한다. 별도 타이머를 두지 않고
 * 카운트다운이 이미 내는 remainMs에서 파생시킨다(틱이 둘이면 숫자와 어긋난다).
 * 좌우를 번갈아 흔들어 "째깍·째깍"으로 읽히게 한다. 마운트 때는 움직이지 않는다.
 */
export function TickingTimerIcon({
  remainMs,
  size = 16,
  className,
}: {
  /** null이면(마감·파싱 실패) 흔들지 않는다. */
  remainMs: number | null;
  size?: number;
  className?: string;
}) {
  const second = remainMs === null ? null : Math.floor(remainMs / 1000);
  const [firstSecond] = useState(second);
  const ticking = second !== null && second !== firstSecond;

  return (
    <span
      key={ticking ? second : "still"}
      className={cn(
        "inline-flex shrink-0",
        ticking && "motion-safe:animate-timer-tick",
      )}
      style={
        ticking
          ? ({ "--tick-dir": second % 2 === 0 ? 1 : -1 } as CSSProperties)
          : undefined
      }
    >
      <TimerIcon size={size} className={className} />
    </span>
  );
}
