"use client";

import { useState } from "react";

import type { BalanceOptionKey } from "@/features/community/domain/balance-game";
import { cn } from "@/shared/lib/cn";

/**
 * 밸런스 게임 머리 바탕 — 위에서 아래로 피드 배경에 녹아드는 옅은 물들임. 홈 카드와 상세가 함께 쓴다.
 *
 * - 투표 전(idle): 선택지 대결(8초, motion.css)과 같은 박자로 기세를 잡은 쪽 색이 깔린다. 빨강이 솟으면
 *   빨강, 파랑이 밀어내면 파랑 — 맞붙는 동안 두 색이 서로 스며들며 넘어간다(balance-hero-a/b).
 * - 고른 뒤: 고른 쪽 색 한 겹으로 머문다.
 *
 * 그라데이션은 배경색처럼 transition되지 않아 색마다 겹을 두고 투명도만 움직인다. 고르거나 취소할 때는
 * 대결 겹 묶음과 고른 색 겹이 500ms에 걸쳐 서로 바뀐다 — 대결 겹은 그동안 사라지지 않고 그 자리에
 * 멈춘다(paused). 대결로 돌아올 때는 key를 바꿔 처음부터 다시 돈다 — 선택지의 대결 동작도 그 순간
 * 처음부터 다시 돌아서(클래스가 다시 붙는다) 둘의 박자가 어긋나지 않는다.
 *
 * 놓이는 곳(부모)은 relative·isolate여야 한다. 이 겹은 -z-1로 부모 글자 밑에 깔린다.
 */
/**
 * 아래로 녹아드는 방식.
 * - top: 위 15%만 짙고 금방 옅어진다 — 카드 머리만 물들 때(기본)
 * - end: 65%까지 짙다가 끝에서 녹는다 — 영역 전체가 물든 히어로가 피드로 이어질 때
 * - none: 녹지 않는다 — 시트가 아래를 덮거나 접힌 바처럼 면 전체를 채울 때
 */
const FADE_MASK = {
  top: "[mask-image:linear-gradient(to_bottom,black,black_15%,transparent)]",
  end: "[mask-image:linear-gradient(to_bottom,black,black_65%,transparent)]",
  none: "",
} as const;

export function BalanceHeroWash({
  myVote,
  idle,
  fade = "top",
  base = false,
  className,
}: {
  myVote: BalanceOptionKey | null;
  /** 선택지가 대결 중인지(투표 전 · 마감 전) — 선택지 버튼의 idle과 같은 조건이어야 박자가 맞는다. */
  idle: boolean;
  fade?: keyof typeof FADE_MASK;
  /**
   * 색 겹 밑에 옅은 회색 바닥을 늘 깐다(#305) — 영역 전체가 물드는 히어로·접힌 바용.
   *
   * 대결 박자에는 두 색이 다 빠지는 순간이 세 번 있고(motion.css balance-hero-a/b), 움직임 줄이기면
   * 대결 겹이 아예 0에 머문다. 머리만 물드는 카드에선 피드 배경이 비쳐도 괜찮지만, 영역 전체가 물든
   * 히어로는 그 순간 피드와 한 면이 돼 층이 사라진다. 바닥은 무채색이라 어느 쪽 색도 편들지 않는다.
   */
  base?: boolean;
  /** 위치·높이. 아래로 녹아드는 길이가 곧 높이다. */
  className?: string;
}) {
  const [lastIdle, setLastIdle] = useState(idle);
  const [round, setRound] = useState(0);
  if (lastIdle !== idle) {
    setLastIdle(idle);
    if (idle) setRound((previous) => previous + 1);
  }

  const layer =
    "absolute inset-0 motion-safe:transition-opacity motion-safe:duration-500 motion-safe:ease-smooth-out";

  return (
    <span
      aria-hidden
      // 아래로 녹아드는 것은 겹의 색이 아니라 이 가림막(mask)이 한다 — 끝이 실제 배경과 맞는다.
      className={cn(
        "pointer-events-none absolute inset-x-0 -z-1",
        FADE_MASK[fade],
        className,
      )}
    >
      {/* 회색 원시값은 시맨틱 토큰을 거치지 않아 Tailwind 색으로 노출돼 있지 않다(page.tsx와 같은 방식). */}
      {base ? (
        <span className="absolute inset-0 bg-[var(--cool-gray-10)]" />
      ) : null}
      <span
        key={round}
        className={cn(layer, idle ? "opacity-100" : "opacity-0")}
      >
        <span
          className={cn(
            "absolute inset-0 bg-surface-poll-a opacity-0 motion-safe:animate-balance-hero-a",
            !idle && "[animation-play-state:paused]",
          )}
        />
        <span
          className={cn(
            "absolute inset-0 bg-surface-poll-b opacity-0 motion-safe:animate-balance-hero-b",
            !idle && "[animation-play-state:paused]",
          )}
        />
      </span>
      <span
        className={cn(
          layer,
          "bg-surface-poll-a",
          myVote === "A" ? "opacity-100" : "opacity-0",
        )}
      />
      <span
        className={cn(
          layer,
          "bg-surface-poll-b",
          myVote === "B" ? "opacity-100" : "opacity-0",
        )}
      />
    </span>
  );
}
