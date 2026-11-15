import type { ReactNode } from "react";

import { CheckIcon, CloseIcon } from "@/shared/ui/icons";

import { Stage } from "./stage";

/** 가이드라인 한 쌍 — 왼쪽 좋은 예, 오른쪽 피할 것. 좁은 화면에서는 위아래로 쌓는다. */
export function Pair({
  good,
  bad,
  goodNote,
  badNote,
  tone,
}: {
  good: ReactNode;
  bad: ReactNode;
  goodNote: ReactNode;
  badNote: ReactNode;
  tone?: "subtle" | "plain";
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <PairSide kind="good" note={goodNote} tone={tone}>
        {good}
      </PairSide>
      <PairSide kind="bad" note={badNote} tone={tone}>
        {bad}
      </PairSide>
    </div>
  );
}

function PairSide({
  kind,
  note,
  tone,
  children,
}: {
  kind: "good" | "bad";
  note: ReactNode;
  tone?: "subtle" | "plain";
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <Stage tone={tone} className="min-h-40">
        {children}
      </Stage>
      <p
        className={
          kind === "good"
            ? "mt-3 flex items-center gap-1 text-button-s text-primary"
            : "mt-3 flex items-center gap-1 text-button-s text-text-error"
        }
      >
        {kind === "good" ? <CheckIcon size={16} /> : <CloseIcon size={16} />}
        {kind === "good" ? "좋은 예" : "피할 것"}
      </p>
      <p className="mt-1 text-body-s text-text-secondary">{note}</p>
    </div>
  );
}
