"use client";

import { useState } from "react";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { useToast } from "@/shared/ui/toast";

/** motion.css의 공통 움직임 — 화면 전용(밸런스 캐릭터 등)은 빼고 여러 곳이 같이 쓰는 것만. */
const MOTIONS = [
  { cls: "motion-safe:animate-pop-in", name: "pop-in", spec: "400ms · spring-bouncy", use: "작은 표시가 톡 나타남" },
  { cls: "motion-safe:animate-dialog-in", name: "dialog-in", spec: "450ms · spring-bouncy", use: "대화상자 등장" },
  { cls: "motion-safe:animate-rise-in", name: "rise-in", spec: "280ms · smooth-out", use: "빈 화면이 아래에서 자리 잡음" },
  { cls: "motion-safe:animate-fade-in", name: "fade-in", spec: "200ms · ease-out", use: "오류 화면 등장" },
  { cls: "motion-safe:animate-overlay-in", name: "overlay-in", spec: "350ms · ease-out", use: "어두운 막이 깔림" },
] as const;

export function MotionDemo() {
  // 누를 때마다 key를 바꿔 요소를 새로 그려 애니메이션을 다시 튼다.
  const [turns, setTurns] = useState<Record<string, number>>({});

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {MOTIONS.map((motion) => (
        <button
          key={motion.name}
          type="button"
          onClick={() =>
            setTurns((prev) => ({
              ...prev,
              [motion.name]: (prev[motion.name] ?? 0) + 1,
            }))
          }
          className="flex flex-col items-start rounded-15 bg-surface-field-subtle p-3 text-left motion-safe:transition-colors motion-safe:duration-120 active:bg-surface-container-pressed"
        >
          <span className="flex h-16 w-full items-center justify-center">
            <span
              key={turns[motion.name] ?? 0}
              className={cn("size-10 rounded-10 bg-primary", motion.cls)}
            />
          </span>
          <span className="mt-2 font-mono text-label-m text-text-primary">
            animate-{motion.name}
          </span>
          <span className="text-label-m text-text-tertiary">{motion.spec}</span>
          <span className="text-label-m text-text-tertiary">{motion.use}</span>
        </button>
      ))}
    </div>
  );
}

export function ToastDemo() {
  const toast = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="neutral" size="m" onClick={() => toast.show("저장했어요")}>
        토스트 띄우기
      </Button>
      <Button
        variant="neutral"
        size="m"
        onClick={() =>
          toast.show("글을 삭제했어요", { label: "되돌리기", onAction: () => {} })
        }
      >
        버튼 있는 토스트
      </Button>
    </div>
  );
}

export function EmptyStateDemo() {
  const toast = useToast();
  return (
    <EmptyState
      title="아직 글이 없어요"
      description="첫 글을 남겨 보세요"
      action={{ label: "다시 시도", onClick: () => toast.show("다시 불러왔어요") }}
      className="py-6"
    />
  );
}
