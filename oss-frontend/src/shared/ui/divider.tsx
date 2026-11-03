import { cn } from "@/shared/lib/cn";

/**
 * 구분 띠 — 글 본문과 댓글처럼 큰 덩어리 사이를 나누는 4px 회색 띠.
 *
 * 선 대신 면으로 나눈다. 같은 덩어리 안의 작은 구분은 이 띠를 쓰지 말고 간격으로 나눈다.
 * 위아래 간격은 호출부가 className으로 정한다(본문 아래는 mt-6).
 */
export function Divider({ className }: { className?: string }) {
  return (
    <div
      role="separator"
      aria-hidden
      className={cn("h-1 bg-divider-bg", className)}
    />
  );
}
