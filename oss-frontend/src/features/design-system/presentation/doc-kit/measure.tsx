"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Reading = Record<string, string>;

const READERS: Record<string, (style: CSSStyleDeclaration, el: HTMLElement) => string> = {
  높이: (_, el) => `${Math.round(el.getBoundingClientRect().height)}`,
  폭: (_, el) => `${Math.round(el.getBoundingClientRect().width)}`,
  // rounded-full은 아주 큰 값(약 3천만 px)으로 그려진다 — 숫자 대신 '둥글게'로 적는다.
  모서리: (style, el) =>
    parseFloat(style.borderTopLeftRadius) >= el.getBoundingClientRect().height / 2
      ? "둥글게"
      : style.borderTopLeftRadius.replace("px", ""),
  좌우: (style) => style.paddingLeft.replace("px", ""),
  글자: (style) =>
    `${style.fontSize.replace("px", "")} / ${style.lineHeight.replace("px", "")} · ${style.fontWeight}`,
};

export type MeasureKey = keyof typeof READERS;

/**
 * 실측 — 안에 그린 실제 부품(첫 요소)의 크기를 getComputedStyle로 읽어 아래에 적는다.
 * 문서의 수치를 손으로 옮겨 적지 않으려고 둔다. 화면에 그려진 값 그대로다.
 * pick으로 읽을 항목만 고른다(높이 · 폭 · 모서리 · 좌우 · 글자).
 */
export function Measure({
  children,
  pick = ["높이", "모서리", "좌우", "글자"],
  label,
  align = "center",
}: {
  children: ReactNode;
  pick?: MeasureKey[];
  label?: ReactNode;
  /** start면 왼쪽 정렬(글자 사다리처럼 줄로 늘어놓을 때). */
  align?: "center" | "start";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [reading, setReading] = useState<Reading | null>(null);
  const pickKey = pick.join(",");

  useEffect(() => {
    const target = ref.current?.firstElementChild as HTMLElement | null;
    if (!target) return;
    const read = () => {
      // 숨은 문서에서는 크기가 0이라 잴 수 없다 — 보일 때까지 기다린다.
      if (target.getBoundingClientRect().width === 0) return;
      const style = getComputedStyle(target);
      const next: Reading = {};
      for (const key of pickKey.split(",")) next[key] = READERS[key](style, target);
      setReading(next);
    };
    // 숨은 문서에 있다가 열릴 때 크기가 생기므로, 크기가 바뀔 때마다 다시 읽는다.
    const observer = new ResizeObserver(read);
    observer.observe(target);
    return () => observer.disconnect();
  }, [pickKey]);

  return (
    <div
      className={
        align === "center"
          ? "flex flex-col items-center gap-3"
          : "flex flex-col items-start gap-1"
      }
    >
      <div
        ref={ref}
        className={align === "center" ? "flex items-center justify-center" : "flex"}
      >
        {children}
      </div>
      <div className={align === "center" ? "text-center" : "text-left"}>
        {label ? <p className="text-label-m text-text-primary">{label}</p> : null}
        <p className="font-mono text-label-m text-text-tertiary">
          {reading
            ? pick.map((key) => `${key} ${reading[key]}`).join(" · ")
            : "재는 중…"}
        </p>
      </div>
    </div>
  );
}
