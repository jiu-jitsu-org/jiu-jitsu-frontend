import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind 클래스 병합 헬퍼.
 *
 * 조건부 클래스(clsx)를 합친 뒤, 충돌하는 유틸리티는 뒤에 온 값으로 정리(tailwind-merge)한다.
 * 컴포넌트 기본 스타일 위에 호출부의 className을 덮어쓸 때 사용한다.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
