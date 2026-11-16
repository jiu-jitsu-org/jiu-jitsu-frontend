import type { ReactNode } from "react";

import { ChevronDownIcon } from "@/shared/ui/icons";

/** 접힘 — 예전 /ds 설명·경위처럼 지우지 않고 남겨 두는 내용. 눌러서 펼친다. */
export function Fold({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details className="group mt-14 rounded-15 open:bg-surface-field-subtle">
      <summary className="flex h-11 cursor-pointer list-none items-center justify-between rounded-15 px-3 text-body-s text-text-secondary active:bg-surface-container-pressed [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <ChevronDownIcon
          size={20}
          className="transition-transform duration-200 group-open:rotate-180"
        />
      </summary>
      <div className="px-3 pb-4">{children}</div>
    </details>
  );
}
