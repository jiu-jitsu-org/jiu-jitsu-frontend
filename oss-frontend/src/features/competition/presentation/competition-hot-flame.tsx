"use client";

import { usePauseMotionWhenHidden } from "@/features/community/presentation/balance/use-pause-motion-when-hidden";
import {
  FLAME_CORE_PATH,
  FLAME_PATH,
} from "@/features/competition/presentation/competition-icons";

/**
 * 대회 줄의 HOT 불꽃 — 가만히 있는 FlameIcon과 같은 그림이 살짝 일렁인다.
 *
 * 불꽃 전체는 밑동을 축으로 흔들리고, 노란 속불은 다른 박자로 깜빡이고, 위에 겹친 주황 불꽃이 옅어졌다 짙어져
 * 빨강 ↔ 주황 사이를 오간다. 세 박자가 어긋나 같은 모양이 되풀이되지 않는다. 색은 겹친 불꽃의 투명도로만 바꾼다.
 * SVG 안쪽 모양(path)을 움직이면 그림 전체를 매 프레임 다시 그리게 되므로, 바깥 불꽃과 속불을 각각
 * 통째로 된 SVG로 겹쳐 놓고 SVG 자체(transform·opacity)만 움직인다. 속불은 바깥 불꽃 상자 안에 있어 흔들림을 같이 탄다.
 * 화면 밖이거나 앱이 가려지면 멈추고, 동작 줄이기 설정이면 움직이지 않는다.
 */
export function HotFlame({ size = 18 }: { size?: number }) {
  const ref = usePauseMotionWhenHidden<HTMLSpanElement>();
  return (
    <span
      ref={ref}
      aria-hidden
      className="relative inline-block flex-none origin-[50%_90%] motion-safe:animate-flame-sway data-[motion-paused]:[animation-play-state:paused] data-[motion-paused]:[&_*]:[animation-play-state:paused]"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        className="absolute inset-0 size-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path className="fill-error" d={FLAME_PATH} />
      </svg>
      <svg
        viewBox="0 0 24 24"
        className="absolute inset-0 size-full opacity-0 motion-safe:animate-flame-glow"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path className="fill-icon-flame-mid" d={FLAME_PATH} />
      </svg>
      <svg
        viewBox="0 0 24 24"
        className="absolute inset-0 size-full origin-[50%_88%] motion-safe:animate-flame-flicker"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path className="fill-icon-flame-core" d={FLAME_CORE_PATH} />
      </svg>
    </span>
  );
}

/**
 * 대회 줄의 HOT 표시 — 불꽃과 'HOT' 글자가 같은 자리에서 번갈아 나온다(4초에 한 번).
 *
 * 불꽃 옆에 HOT을 늘 같이 두면 같은 뜻을 두 번 말하고 이름 줄 자리도 더 먹는다. 그래서 한 자리에 겹쳐 두고
 * 불꽃(약 2.4초)이 위로 빠지면 HOT(약 0.9초)이 아래에서 올라왔다가 다시 불꽃으로 돌아간다. 자리 폭은 둘 중 넓은 HOT에
 * 맞춰 고정하고 둘 다 왼쪽에 붙여, 바뀌는 동안 이름 줄이 흔들리지 않고 이름과의 틈도 같다. 화면 밖이거나 앱이 가려지면 멈추고,
 * 동작 줄이기 설정이면 불꽃만 가만히 보인다. 읽어 주는 이름은 호출부가 따로 단다.
 */
export function HotMark({ size = 18 }: { size?: number }) {
  const ref = usePauseMotionWhenHidden<HTMLSpanElement>();
  return (
    <span
      ref={ref}
      aria-hidden
      className="inline-grid flex-none items-center justify-items-start data-[motion-paused]:[&_*]:[animation-play-state:paused]"
    >
      <span className="[grid-area:1/1] motion-safe:animate-hot-swap-flame">
        <HotFlame size={size} />
      </span>
      <span className="[grid-area:1/1] opacity-0 motion-safe:animate-hot-swap-text">
        HOT
      </span>
    </span>
  );
}
