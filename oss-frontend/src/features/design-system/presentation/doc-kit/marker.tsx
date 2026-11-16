import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * 해부도 번호 — 견본 위 가리키는 자리에 얹는 먹색 동그라미.
 * 부품이 파랑이어도 묻히지 않게 먹색 + 흰 테를 두른다.
 * Stage 안에서 absolute로 놓는다(top·left는 판 기준 px 또는 %).
 */
export function Marker({
  n,
  top,
  left,
  className,
}: {
  n: number;
  top: string;
  left: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute z-10 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-text-primary text-label-m text-text-on-dark ring-2 ring-surface-container",
        className,
      )}
      style={{ top, left }}
    >
      {n}
    </span>
  );
}

/** 번호별 이름 — 해부도 아래에 둔다. */
export function MarkerLegend({
  items,
}: {
  items: { name: ReactNode; note?: ReactNode }[];
}) {
  return (
    <ol className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-2">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-text-primary text-label-m text-text-on-dark">
            {index + 1}
          </span>
          <span className="min-w-0">
            <span className="block text-body-s text-text-primary">{item.name}</span>
            {item.note ? (
              <span className="block text-label-m text-text-tertiary">{item.note}</span>
            ) : null}
          </span>
        </li>
      ))}
    </ol>
  );
}
