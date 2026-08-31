import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/** globals.css `@theme`에 정의한 타이포 스케일 이름(= `text-*` 클래스 접미사). */
const TYPOGRAPHY_SCALE = [
  "display-1",
  "title-1",
  "title-2",
  "title-3",
  "body-m",
  "body-s",
  "label-m",
  "button-l",
  "button-m",
  "button-s",
];

/**
 * tailwind-merge는 `text-*`의 접미사가 t셔츠 사이즈(sm·lg…)나 길이값이 아니면 크기가 아닌
 * **색상**으로 분류한다. 스케일 이름은 둘 다 아니라서, 기본 설정 그대로 두면
 * `cn("text-body-s text-feed-card-body-text")`처럼 한 요소에 타이포 토큰과 색 토큰이 같이 오는
 * 순간 같은 그룹으로 보고 뒤에 온 색만 남긴다 — 타이포가 통째로 사라진다(굵기·행간까지).
 *
 * 그래서 스케일 이름을 font-size 그룹에 등록해 색과 충돌하지 않게 한다.
 * 스케일에 이름을 추가하면 이 배열에도 넣어야 한다.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: TYPOGRAPHY_SCALE }],
    },
  },
});

/**
 * Tailwind 클래스 병합 헬퍼.
 *
 * 조건부 클래스(clsx)를 합친 뒤, 충돌하는 유틸리티는 뒤에 온 값으로 정리(tailwind-merge)한다.
 * 컴포넌트 기본 스타일 위에 호출부의 className을 덮어쓸 때 사용한다.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
