import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";
import { PRESS_BOUNCE } from "@/shared/ui/press-styles";

/**
 * 글자 버튼 — 화면마다 따로 조합하던 버튼 클래스를 한 곳에 모았다.
 *
 * 크기
 * - s  32 · 모서리 10 · 좌우 12 · Button S  (배너 "앱에서 보기", 차단 해제 등)
 * - m  38 · 모서리 10 · 좌우 16 · Button M  (빈 화면·오류 화면의 다시 시도)
 * - l  51 · 모서리 15 · Button M · 좌우 여백 없음 (대화상자·시트 하단 버튼 — 폭은 호출부가 flex-1/w-full로)
 *
 * 색(variant)은 Figma 버튼 토큰 이름을 그대로 쓴다. 눌림은 크기에 따라 정해진다:
 * s·m은 눌림 색만 120ms로 깔리고, l은 눌림 색 + 살짝 눌렸다 출렁이는 PRESS_BOUNCE.
 * 눌림 색은 `not-disabled:`로 걸어 비활성 버튼은 눌려도 변하지 않는다(링크 <a>에 buttonVariants를 써도 눌림이 보인다).
 */
export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center",
  {
    variants: {
      variant: {
        filled:
          "bg-button-filled-default-bg text-button-filled-default-text not-disabled:active:bg-button-filled-pressed-bg disabled:bg-button-filled-disabled-bg disabled:text-button-filled-disabled-text",
        neutral:
          "bg-button-neutral-default-bg text-button-neutral-default-text not-disabled:active:bg-button-neutral-pressed-bg disabled:bg-button-neutral-disabled-bg disabled:text-button-neutral-disabled-text",
        tint: "bg-button-tint-default-bg text-button-tint-default-text not-disabled:active:bg-button-tint-pressed-bg disabled:bg-button-tint-disabled-bg disabled:text-button-tint-disabled-text",
        text: "bg-button-text-default-bg text-button-text-default-text not-disabled:active:bg-button-text-pressed-bg disabled:text-button-text-disabled-text",
        /** 시트 하단의 주 행동(저장·완료). */
        cta: "bg-cta-primary-bg text-cta-primary-text not-disabled:active:bg-cta-primary-pressed-bg disabled:bg-cta-primary-disabled-bg disabled:text-cta-primary-disabled-text",
        /** 시트 하단 주 행동 밑의 보조 행동(나중에). */
        "cta-ghost":
          "bg-cta-transparent-text-bg text-cta-transparent-text-text not-disabled:active:bg-cta-transparent-text-pressed-bg disabled:text-cta-transparent-text-disabled-text",
        /** 삭제·차단처럼 되돌리기 어려운 확인. 눌림 색 토큰이 없어 밝기만 낮춘다. */
        destructive:
          "bg-confirm-dialog-destructive-button-bg text-button-filled-default-text not-disabled:active:brightness-90",
      },
      size: {
        s: "h-8 rounded-10 px-3 text-button-s motion-safe:transition-colors motion-safe:duration-120",
        m: "h-[38px] rounded-10 px-4 text-button-m motion-safe:transition-colors motion-safe:duration-120",
        l: cn("h-[51px] rounded-15 text-button-m", PRESS_BOUNCE),
      },
    },
    defaultVariants: { variant: "filled", size: "m" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
