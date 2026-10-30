import type { ReactNode } from "react";

import type { Belt, BeltRank } from "@/features/community/domain/belt";

/** feed: 피드·상세·댓글 작성자 줄(사진 26) · large: 커뮤니티 활동 머리 같은 큰 자리(사진 64). */
export type BeltAvatarSize = "feed" | "large";

/** 띠 색(CSS 값). 띠를 고르는 칩의 색 점도 같은 값을 쓴다. */
export const BELT_COLOR: Record<BeltRank, string> = {
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

/**
 * 띠를 아직 안 정한 회원의 테두리 — 띠와 같은 자리·두께의 점선, 검은 칸 없이.
 * 실선 옅은 회색은 흰띠(cool-gray-200)와 한눈에 구분되지 않아서 점선으로 가른다.
 */
const NO_BELT_COLOR = "var(--cool-gray-200)";
/** 점선 한 칸 중 선이 차지하는 비율 — 선과 틈을 반반. */
const NO_BELT_DASH_FILL = 0.5;

// photo: 사진 지름, gap: 사진과 테두리 사이 틈, ring: 테두리 두께, mark: 그랄 줄 굵기
// dash: 띠 없음 점선 한 칸(선+틈) 길이 — 둘레에 딱 나눠떨어지게 조금 늘거나 준다. 4는 촘촘해 시끄러워 6.
// grau4: 4그랄 전용 — mark: 줄 굵기, space: 줄 사이, pad: 검은 칸 양 끝 ↔ 바깥 줄 (px, 테두리 중심선 길이)
const RING_SIZES = {
  feed: { photo: 26, gap: 2, ring: 3, mark: 1.5, dash: 6, grau4: { mark: 2, space: 2, pad: 3 } },
  large: { photo: 64, gap: 3, ring: 5, mark: 2.5, dash: 10, grau4: { mark: 3, space: 3, pad: 5 } },
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
 * 띠가 없으면(belt null) 같은 자리에 회색 점선만 그린다 — 띠 있는 회원과 줄이 맞는다.
 *
 * 모양 수치는 시안 스크립트(assets/belt-avatar 브랜치 shot4, mode a)를 그대로 옮겼다. 다만 4그랄은 44°에
 * 넣으면 줄이 뭉쳐 안 읽혀서, 줄 굵기·사이를 2·2로 두고 양 끝 줄 바깥에 검은 칸을 3 남기도록 칸을 늘린다.
 * 사진(children)은 사진 칸을 꽉 채우게(size-full) 넘긴다. 틈은 투명이라 어떤 바탕 위에서도 쓸 수 있다.
 */
export function BeltAvatar({
  belt,
  size = "feed",
  children,
}: {
  /** null이면 띠를 아직 안 정한 회원 — 점선만. */
  belt: Belt | null;
  size?: BeltAvatarSize;
  /** 사진. 사진 칸을 꽉 채우게(size-full) 넘긴다. */
  children: ReactNode;
}) {
  const { photo, gap, ring, mark, dash, grau4 } = RING_SIZES[size];
  const box = photo + 2 * (gap + ring);
  const c = box / 2;
  const r = photo / 2 + gap + ring / 2; // 테두리 중심선 반지름
  const pxToDeg = (px: number) => (px / (2 * Math.PI * r)) * 360;
  const wide = belt?.grau === 4;
  const markDeg = pxToDeg(wide ? grau4.mark : mark);
  const pitchDeg = pxToDeg(wide ? grau4.mark + grau4.space : mark * 2.4);
  const barDeg = wide
    ? pxToDeg(4 * grau4.mark + 3 * grau4.space + 2 * grau4.pad)
    : BAR_WIDTH;
  const circumference = 2 * Math.PI * r;
  const dashPeriod = circumference / Math.round(circumference / dash);

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
        {belt ? (
          <>
            <circle cx={c} cy={c} r={r} style={{ stroke: BELT_COLOR[belt.rank] }} />
            <path
              d={arcPath(c, r, BAR_CENTER - barDeg / 2, BAR_CENTER + barDeg / 2)}
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
          </>
        ) : (
          <circle
            cx={c}
            cy={c}
            r={r}
            strokeDasharray={`${dashPeriod * NO_BELT_DASH_FILL} ${dashPeriod * (1 - NO_BELT_DASH_FILL)}`}
            style={{ stroke: NO_BELT_COLOR }}
          />
        )}
      </svg>
      <span className="relative inline-flex" style={{ width: photo, height: photo }}>
        {children}
      </span>
    </span>
  );
}
