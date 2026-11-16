import type { ReactNode } from "react";

import { Marker } from "./marker";

/**
 * 해부도 견본 — 실제 부품을 감싸고 그 위에 번호를 얹는다.
 * 번호 위치는 부품 상자 기준 %라 부품 크기가 바뀌어도 같은 자리를 가리킨다.
 */
export function Anatomy({
  children,
  marks,
  start = 1,
}: {
  children: ReactNode;
  marks: { top: string; left: string }[];
  /** 한 판에 견본이 둘 이상일 때 이어지는 번호의 시작. */
  start?: number;
}) {
  return (
    <span className="relative inline-flex">
      {children}
      {marks.map((mark, index) => (
        <Marker key={index} n={start + index} top={mark.top} left={mark.left} />
      ))}
    </span>
  );
}
