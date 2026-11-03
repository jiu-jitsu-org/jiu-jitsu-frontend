import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * 아이콘 버튼 — 아이콘 하나만 든 버튼. 이름(aria-label)은 꼭 넘긴다.
 *
 * - ghost  평소엔 바탕 없음, 누르는 동안 둥근 옅은 면(앱바 뒤로·⋮·알림, 댓글 입력 바)
 * - tint   옅은 파란 네모 바탕, 모서리 10(글쓰기·사진 편집 앱바, 사진 보기 닫기)
 *
 * 크기: s 36 · m 40 · l 44. 아이콘은 24가 기본이고, 호출부가 children으로 넣는다.
 * 아이콘 색은 currentColor라 버튼의 글자색(variant)이 그대로 칠해진다.
 */
export const iconButtonVariants = cva(
  "inline-flex shrink-0 items-center justify-center motion-safe:transition-colors motion-safe:duration-120",
  {
    variants: {
      variant: {
        ghost:
          "rounded-full text-icon-primary active:bg-surface-container-pressed",
        tint: "rounded-10 bg-button-tint-default-bg text-button-tint-default-text active:bg-button-tint-pressed-bg disabled:bg-button-tint-disabled-bg disabled:text-button-tint-disabled-text",
      },
      size: {
        s: "size-9",
        m: "size-10",
        l: "size-11",
      },
    },
    defaultVariants: { variant: "ghost", size: "m" },
  },
);

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof iconButtonVariants> & {
    /** 스크린리더가 읽는 이름 — 아이콘만 있어 꼭 필요하다. */
    "aria-label": string;
  };

export function IconButton({
  variant,
  size,
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(iconButtonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
