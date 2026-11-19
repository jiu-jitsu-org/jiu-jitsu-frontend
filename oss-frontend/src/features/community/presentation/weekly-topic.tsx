import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * 이번 주 써 볼 주제(#588 · #590) — 옅은 회색 상자 안에 이름 한 줄 + 주제 글.
 *
 * 홈 카테고리 탭 위(오른쪽에 '이 주제로 쓰기')와, 그 버튼으로 연 글쓰기 위(버튼 없음)가 같은 모양을 쓴다 —
 * 보던 상자가 글쓰기에서도 그대로 이어져 "이 주제로 쓰는 중"이 읽히게.
 * 구분은 선 없이 면으로 한다(대회 목록 줄과 같은 surface-field · 모서리 20).
 */
export function WeeklyTopic({
  topic,
  action,
  className,
}: {
  topic: string;
  /** 오른쪽 버튼(홈의 '이 주제로 쓰기'). 글쓰기 화면은 없다. */
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-label="이번 주 써 볼 주제"
      className={cn(
        "flex items-center gap-3 rounded-20 bg-surface-field px-4 py-3",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-label-m text-text-secondary">이번 주 써 볼 주제</p>
        <p className="mt-0.5 text-body-m wrap-anywhere text-text-primary">
          {topic}
        </p>
      </div>
      {action}
    </section>
  );
}
