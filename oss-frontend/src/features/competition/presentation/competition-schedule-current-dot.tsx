"use client";

import { usePauseMotionWhenHidden } from "@/features/community/presentation/balance/use-pause-motion-when-hidden";

/**
 * 일정의 지금 단계 점 — 가만히 있는 후광 위로 같은 색 물결이 두 번 연달아 퍼지고 쉰다.
 * "지금 여기"를 글 없이 움직임으로 알린다. 점이 화면 밖이거나 앱이 가려지면 물결을 멈추고,
 * 동작 줄이기 설정이면 물결 없이 후광만 남는다.
 */
export function ScheduleCurrentDot() {
  const ref = usePauseMotionWhenHidden<HTMLSpanElement>();
  return (
    <span
      ref={ref}
      className="relative flex size-3 data-[motion-paused]:[&_*]:[animation-play-state:paused]"
    >
      <span className="absolute inset-0 rounded-full bg-primary opacity-0 motion-safe:animate-schedule-ripple" />
      <span className="relative size-3 rounded-full bg-primary ring-4 ring-primary/25" />
    </span>
  );
}
