import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * 견본 판 — 부품을 올려 보여 주는 옅은 회색 면.
 *
 * tone="plain"은 판을 깔지 않는다. 회색 버튼·뼈대처럼 부품 자체가 회색 면인 것은
 * 실제 화면과 같은 바탕 위에서 봐야 모양이 제대로 읽혀서다(예전 /ds의 원칙을 잇는다).
 * 해부도 번호(Marker)를 얹으려면 판이 relative라 안쪽에서 absolute로 둔다.
 */
export function Stage({
  children,
  tone = "subtle",
  align = "center",
  caption,
  className,
}: {
  children: ReactNode;
  tone?: "subtle" | "plain";
  align?: "center" | "start";
  caption?: ReactNode;
  className?: string;
}) {
  return (
    <figure className="mt-4">
      <div
        className={cn(
          "relative flex min-h-36 flex-wrap gap-3 rounded-20 px-6 py-8",
          tone === "subtle" ? "bg-surface-field-subtle" : "bg-surface-container",
          align === "center"
            ? "items-center justify-center"
            : "flex-col items-stretch",
          className,
        )}
      >
        {children}
      </div>
      {caption ? (
        <figcaption className="mt-2 text-label-m text-text-tertiary">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
