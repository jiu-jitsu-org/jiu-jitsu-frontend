import { cn } from "@/shared/lib/cn";

/**
 * 불러오는 중 뼈대 블록 — 실제 내용이 들어올 자리에 옅은 회색 면을 깐다.
 *
 * 크기·모양은 className으로 정한다(예: 글 줄 `h-4 w-40`, 동그란 프로필 `size-10 rounded-full`).
 * 깜빡임(animate-pulse)은 블록마다 걸지 않고 줄이나 화면 전체를 감싼 바깥에 한 번 건다 —
 * 블록마다 걸면 타이밍이 미세하게 어긋나 지저분하게 반짝인다.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("block rounded bg-feed-card-header-avatar-bg", className)}
    />
  );
}
