import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * 줄 없는 표 — 줄은 옅은 면을 번갈아 깔아 나눈다(선을 긋지 않는다).
 * 좁은 화면에서는 가로로 밀어 본다.
 */
export function DocTable({
  head,
  rows,
  cols,
  className,
}: {
  head: ReactNode[];
  rows: ReactNode[][];
  /** grid-template-columns. 기본은 칸을 똑같이 나눈다. */
  cols?: string;
  className?: string;
}) {
  const template = cols ?? `repeat(${head.length}, minmax(0, 1fr))`;
  return (
    <div className={cn("mt-4 overflow-x-auto", className)}>
      <div role="table" className="min-w-[560px]">
        <div
          role="row"
          className="grid gap-4 px-3 pb-2 text-label-m text-text-tertiary"
          style={{ gridTemplateColumns: template }}
        >
          {head.map((cell, index) => (
            <span role="columnheader" key={index}>
              {cell}
            </span>
          ))}
        </div>
        {rows.map((row, rowIndex) => (
          <div
            role="row"
            key={rowIndex}
            className="grid items-center gap-4 rounded-15 px-3 py-2.5 text-body-s text-text-primary odd:bg-surface-field-subtle"
            style={{ gridTemplateColumns: template }}
          >
            {row.map((cell, index) => (
              <span role="cell" key={index} className="min-w-0 break-words">
                {cell}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
