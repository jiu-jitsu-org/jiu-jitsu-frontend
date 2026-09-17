import type { IconProps } from "./types";

/**
 * 크롭 프리셋 비율 아이콘 3종 — 글쓰기 크롭 편집기 프리셋 버튼(디자인 crop1/2/3.svg, 20x20 기준).
 *
 * 각각 4:3(가로) · 1:1(정사각) · 4:5(세로) 모양의 둥근 사각형. 색은 currentColor를 상속받아 선택/비선택을 부모가
 * button/inverted-subtle 토큰으로 정한다(원본 svg의 white 60% / #FAFAFA는 그 토큰 값과 같다).
 * IconBase는 24 viewBox 전용이라 20 viewBox를 따로 그린다.
 */
function CropRatioIconBase({
  size = 20,
  d,
  ...props
}: IconProps & { d: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <path
        d={d}
        stroke="currentColor"
        strokeWidth={1.66667}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 4:3 — 가로로 긴 사각형. */
export function CropRatio43Icon(props: IconProps) {
  return (
    <CropRatioIconBase
      d="M16.668 5H3.33464C2.41416 5 1.66797 5.74619 1.66797 6.66667V13.3333C1.66797 14.2538 2.41416 15 3.33464 15H16.668C17.5884 15 18.3346 14.2538 18.3346 13.3333V6.66667C18.3346 5.74619 17.5884 5 16.668 5Z"
      {...props}
    />
  );
}

/** 1:1 — 정사각형. */
export function CropRatio11Icon(props: IconProps) {
  return (
    <CropRatioIconBase
      d="M15.8333 2.5H4.16667C3.24619 2.5 2.5 3.24619 2.5 4.16667V15.8333C2.5 16.7538 3.24619 17.5 4.16667 17.5H15.8333C16.7538 17.5 17.5 16.7538 17.5 15.8333V4.16667C17.5 3.24619 16.7538 2.5 15.8333 2.5Z"
      {...props}
    />
  );
}

/** 4:5 — 세로로 긴 사각형. */
export function CropRatio45Icon(props: IconProps) {
  return (
    <CropRatioIconBase
      d="M13.3333 1.66699H6.66667C5.74619 1.66699 5 2.41318 5 3.33366V16.667C5 17.5875 5.74619 18.3337 6.66667 18.3337H13.3333C14.2538 18.3337 15 17.5875 15 16.667V3.33366C15 2.41318 14.2538 1.66699 13.3333 1.66699Z"
      {...props}
    />
  );
}
