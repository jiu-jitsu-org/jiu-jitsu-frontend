import type { ReactNode } from "react";

import type { Belt, BeltRank } from "@/features/community/domain/belt";

/** feed: 피드·상세·댓글 작성자 줄(사진 26) · large: 커뮤니티 활동 머리 같은 큰 자리(사진 64). */
export type BeltAvatarSize = "feed" | "large";

const BELT_COLOR: Record<BeltRank, string> = {
  white: "var(--my-profile-header-bg-white)",
  blue: "var(--my-profile-header-bg-blue)",
  purple: "var(--my-profile-header-bg-purple)",
  brown: "var(--my-profile-header-bg-brown)",
  black: "var(--my-profile-header-bg-black)",
};

// 각도는 12시 = 0°, 시계 방향.
function pointAt(cx: number, cy: number, angle: number, radius: number) {
  const rad = (angle * Math.PI) / 180;
  return [cx + radius * Math.sin(rad), cy - radius * Math.cos(rad)];
}

// photo: 사진 지름, gap: 사진과 테두리 사이 틈, ring: 테두리 두께, mark: 그랄 줄 굵기
const RING_SIZES = {
  feed: { photo: 26, gap: 2, ring: 3, mark: 1.5 },
  large: { photo: 64, gap: 3, ring: 5, mark: 2.5 },
} as const;
/** 띠 끝 검은 칸: 오른쪽 아래(135°) 가운데, 폭 44°. */
const BAR_CENTER = 135;
const BAR_WIDTH = 44;

/** 원 둘레 from°→to° 구간(시계 방향). 굵기는 stroke-width로 준다. */
function arcPath(c: number, r: number, from: number, to: number): string {
  const [x0, y0] = pointAt(c, c, from, r);
  const [x1, y1] = pointAt(c, c, to, r);
  const largeArc = to - from > 180 ? 1 : 0;
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${largeArc} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

/**
 * 띠 아바타 (#265) — 프로필 사진 둘레에 띠 색 테두리와 그랄 줄을 그린다. 이미지 없이 SVG로 그린다.
 *
 * 사진 → 틈 → 띠 색 테두리(인스타 스토리식). 테두리 오른쪽 아래가 띠 끝 검은 칸(검은띠는 빨간 칸),
 * 그 위에 흰 그랄 줄. 피드에서 사진 26 · 틈 2 · 테두리 3 = 36.
 *
 * 모양 수치는 시안 스크립트(assets/belt-avatar 브랜치 shot4, mode a)를 그대로 옮겼다.
 * 사진(children)은 사진 칸을 꽉 채우게(size-full) 넘긴다. 틈은 투명이라 어떤 바탕 위에서도 쓸 수 있다.
 */
export function BeltAvatar({
  belt,
  size = "feed",
  children,
}: {
  belt: Belt;
  size?: BeltAvatarSize;
  /** 사진. 사진 칸을 꽉 채우게(size-full) 넘긴다. */
  children: ReactNode;
}) {
  const { photo, gap, ring, mark } = RING_SIZES[size];
  const box = photo + 2 * (gap + ring);
  const c = box / 2;
  const r = photo / 2 + gap + ring / 2; // 테두리 중심선 반지름
  const pxToDeg = (px: number) => (px / (2 * Math.PI * r)) * 360;
  const markDeg = pxToDeg(mark);
  const pitchDeg = pxToDeg(mark * 2.4);

  return (
    <span className="relative inline-flex shrink-0" style={{ padding: gap + ring }}>
      <svg
        aria-hidden="true"
        width={box}
        height={box}
        viewBox={`0 0 ${box} ${box}`}
        fill="none"
        strokeWidth={ring}
        className="pointer-events-none absolute inset-0"
      >
        <circle cx={c} cy={c} r={r} style={{ stroke: BELT_COLOR[belt.rank] }} />
        <path
          d={arcPath(c, r, BAR_CENTER - BAR_WIDTH / 2, BAR_CENTER + BAR_WIDTH / 2)}
          style={{ stroke: belt.rank === "black" ? "var(--red-500)" : "var(--bw-black)" }}
        />
        {Array.from({ length: belt.grau }, (_, i) => {
          const center = BAR_CENTER + (i - (belt.grau - 1) / 2) * pitchDeg;
          return (
            <path
              key={i}
              d={arcPath(c, r, center - markDeg / 2, center + markDeg / 2)}
              style={{ stroke: "var(--bw-true-white)" }}
            />
          );
        })}
      </svg>
      <span className="relative inline-flex" style={{ width: photo, height: photo }}>
        {children}
      </span>
    </span>
  );
}
