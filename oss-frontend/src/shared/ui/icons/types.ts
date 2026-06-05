import type { SVGProps } from "react";

/** 아이콘 기본 한 변 크기(px). */
export const DEFAULT_ICON_SIZE = 24;

/**
 * 모든 아이콘 컴포넌트의 공통 props.
 *
 * 색상은 내부에 박지 않고 `currentColor`로 상속한다 → 부모의 `text-*` 토큰 유틸리티가
 * 그대로 아이콘 색이 된다. (하드코딩 색상 금지 원칙)
 */
export type IconProps = Omit<SVGProps<SVGSVGElement>, "width" | "height"> & {
  /** 정사각형 한 변 px. 기본 {@link DEFAULT_ICON_SIZE}. */
  size?: number;
};
