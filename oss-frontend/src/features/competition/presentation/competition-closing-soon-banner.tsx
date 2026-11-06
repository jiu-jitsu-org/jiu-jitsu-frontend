"use client";

import { useState } from "react";

import type { ClosingSoonItem } from "@/features/competition/domain/competition-closing-soon";
import { cn } from "@/shared/lib/cn";
import { ChevronLeftIcon } from "@/shared/ui/icons";
import { SURFACE_PRESS } from "@/shared/ui/press-styles";

/** 처음 보이는 줄 수. 넘치면 "N개 더 보기"로 접어 둔다 — 배너가 목록을 밀어내지 않게. */
const MAX_ROWS = 3;

/**
 * 관심 대회 마감 배너 (#344) — 필터 줄 바로 아래, 관심 대회 중 곧 마감인 대회.
 *
 * 2026-11 시안 ⑤ "큰 D-day 앞에": 줄마다 왼쪽에 큰 남은 날, 오른쪽에 이름과 마감 종류 두 줄.
 * 아래 대회 카드의 큰 D-day와 같은 말투라 한 화면처럼 읽힌다. 테두리 없이 회색 면 하나로 목록과 나눈다.
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
      className="mx-3 mt-1 mb-2 rounded-15 bg-surface-field px-1 pt-2.5 pb-1"
    >
      <h2
        id="competition-closing-soon-title"
        className="px-2 text-[12px] leading-[16px] font-semibold text-primary"
      >
        관심 대회 · 곧 마감
      </h2>
      <ul className="mt-0.5 flex flex-col">
        {shown.map((item) => {
          const earlyBird = item.registration.deadline === "early-bird";
          const { daysLeft } = item.registration;
          return (
            <li key={item.competition.id}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className={cn(
                  "flex min-h-11 w-full items-center gap-3 rounded-10 px-2 py-1 text-left",
                  SURFACE_PRESS,
                )}
              >
                <span
                  className={cn(
                    "w-11 flex-none text-[20px] leading-[22px] font-bold tabular-nums",
                    earlyBird ? "text-text-error" : "text-primary",
                  )}
                >
                  {daysLeft === 0 ? "오늘" : `D-${daysLeft}`}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[14px] leading-[20px] font-semibold text-text-primary">
                    {item.competition.name}
                  </span>
                  <span className="text-[12px] leading-[16px] text-text-secondary">
                    {earlyBird ? "얼리버드 마감" : "접수 마감"}
                  </span>
                </span>
                <ChevronLeftIcon
                  size={16}
                  className="flex-none rotate-180 text-text-tertiary"
                />
              </button>
            </li>
          );
        })}
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
