"use client";

import { useState } from "react";

import type { ClosingSoonItem } from "@/features/competition/domain/competition-closing-soon";
import { deadlineLabel } from "@/features/competition/presentation/competition-month-section";
import { cn } from "@/shared/lib/cn";
import { SURFACE_PRESS } from "@/shared/ui/press-styles";

/** 처음 보이는 줄 수. 넘치면 "N개 더 보기"로 접어 둔다 — 배너가 목록을 밀어내지 않게. */
const MAX_ROWS = 3;

/**
 * 관심 대회 마감 배너 (#344) — 필터 줄 바로 아래, 관심 대회 중 곧 마감인 대회.
 *
 * 제안서 시안대로 옅은 면 위에 파랑 테두리 하나로 목록과 구분한다. 줄마다 왼쪽 이름, 오른쪽 남은 날 —
 * 얼리버드 마감만 빨강(목록 줄과 같은 규칙). 줄을 누르면 목록(또는 달력)의 그 대회로 간다.
 * 곧 마감인 관심 대회가 없으면 아무것도 그리지 않는다.
 */
export function CompetitionClosingSoonBanner({
  items,
  onSelect,
}: {
  items: readonly ClosingSoonItem[];
  onSelect: (item: ClosingSoonItem) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return null;
  const shown = expanded ? items : items.slice(0, MAX_ROWS);
  const rest = items.length - shown.length;

  return (
    <section
      aria-labelledby="competition-closing-soon-title"
      className="mx-3 mt-1 mb-1 rounded-15 border-[1.5px] border-primary bg-surface-field px-1 pt-2.5 pb-1.5"
    >
      <h2
        id="competition-closing-soon-title"
        className="px-2 text-[12px] leading-[16px] font-semibold text-primary"
      >
        관심 대회 · 곧 마감
      </h2>
      <ul className="mt-1 flex flex-col">
        {shown.map((item) => (
          <li key={item.competition.id}>
            <button
              type="button"
              onClick={() => onSelect(item)}
              className={cn(
                "flex min-h-9 w-full items-center justify-between gap-2 rounded-10 px-2 text-left text-[13px] leading-[19px]",
                SURFACE_PRESS,
              )}
            >
              <span className="min-w-0 truncate font-semibold text-text-primary">
                {item.competition.name}
              </span>
              <span
                className={cn(
                  "flex-none",
                  item.registration.deadline === "early-bird"
                    ? "font-semibold text-text-error"
                    : "text-text-secondary",
                )}
              >
                {deadlineLabel(item.registration)}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {rest > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className={cn(
            "flex min-h-8 w-full items-center rounded-10 px-2 text-[12px] leading-[16px] text-text-secondary",
            SURFACE_PRESS,
          )}
        >
          {rest}개 더 보기
        </button>
      ) : null}
    </section>
  );
}
