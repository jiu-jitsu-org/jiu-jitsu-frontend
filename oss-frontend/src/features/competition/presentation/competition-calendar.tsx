"use client";

import { useMemo, useState } from "react";

import type {
  CompetitionListItem,
  CompetitionListMonth,
} from "@/features/competition/application/get-competition-list-page-data";
import { CompetitionRow } from "@/features/competition/presentation/competition-month-section";
import type { CompetitionInterest } from "@/features/competition/presentation/use-competition-interest";
import { cn } from "@/shared/lib/cn";
import { ChevronLeftIcon } from "@/shared/ui/icons";
import { IconButton } from "@/shared/ui/icon-button";

type YearMonth = { year: number; month: number };

/**
 * 대회 달력 보기 (#339) — 달 하나를 칸으로 펼치고, 날짜를 고르면 그날 대회를 목록과 같은 줄로 아래에 보여 준다.
 *
 * 대회가 있는 날은 숫자 아래 점 하나로 표시한다. 대회의 대부분이 토·일에 몰려 주말마다 2~4개가 겹치는데,
 * 칸마다 숫자를 적으면 주말 줄이 숫자로 빽빽해진다. 몇 개인지는 날짜를 누르면 바로 아래에 보인다.
 * 처음에는 오늘 이후 가장 가까운 대회 날을 골라 둔다 — 오늘을 고르면 평일엔 거의 늘 빈 목록부터 보인다.
 *
 * 목록의 필터가 그대로 걸린다. 넘겨받는 months가 이미 거른 결과다.
 * 지난 대회는 불러오지 않으므로 이번 달보다 앞으로는 넘기지 않고, 대회가 있는 마지막 달까지만 넘긴다.
 */
export function CompetitionCalendar({
  months,
  lastMonth,
  today,
  currentYear,
  interest,
  filtered,
  focusDate,
}: {
  /** 필터로 거른 뒤의 월별 대회. */
  months: CompetitionListMonth[];
  /** 거르기 전 기준 대회가 있는 마지막 달 — 다음 달 넘기기의 끝. */
  lastMonth: YearMonth;
  /** 한국 날짜 "YYYY-MM-DD" */
  today: string;
  currentYear: number;
  interest: CompetitionInterest;
  /** 필터가 켜져 있는지 — 빈 날 문구를 "조건에 맞는 대회가 없어요"로 바꾼다. */
  filtered: boolean;
  /** 처음 골라 둘 날짜 — 마감 배너(#344)에서 누른 대회 날. 바꾸려면 key도 바꿔 다시 그린다. */
  focusDate?: string;
}) {
  const firstMonth = useMemo(() => yearMonthOf(today), [today]);

  const byDate = useMemo(() => {
    const map = new Map<string, CompetitionListItem[]>();
    for (const month of months) {
      for (const item of month.items) {
        const list = map.get(item.competition.date);
        if (list) list.push(item);
        else map.set(item.competition.date, [item]);
      }
    }
    return map;
  }, [months]);

  const [initialDate] = useState(
    () => focusDate ?? months[0]?.items[0]?.competition.date ?? today,
  );
  const [view, setView] = useState<YearMonth>(() => yearMonthOf(initialDate));
  const [selected, setSelected] = useState<string>(initialDate);

  const canGoPrev = compareYearMonth(view, firstMonth) > 0;
  const canGoNext = compareYearMonth(view, lastMonth) < 0;

  const moveMonth = (delta: 1 | -1) => {
    const next = addMonth(view, delta);
    setView(next);
    // 넘긴 달의 첫 대회 날을 골라 둔다 — 없으면 이번 달이면 오늘, 아니면 1일.
    const prefix = `${next.year}-${pad(next.month)}-`;
    const firstDay = [...byDate.keys()]
      .filter((date) => date.startsWith(prefix))
      .sort()[0];
    setSelected(
      firstDay ??
        (compareYearMonth(next, firstMonth) === 0 ? today : `${prefix}01`),
    );
  };

  const selectedItems = byDate.get(selected) ?? [];
  const selectedLabel = dayLabel(selected, currentYear);

  return (
    <div className="pb-6">
      <section
        aria-label="대회 달력"
        className="mx-3 mt-1 rounded-20 bg-surface-field-subtle px-2 pt-2 pb-3"
      >
        <div className="flex items-center justify-between">
          <IconButton
            aria-label="이전 달"
            disabled={!canGoPrev}
            onClick={() => moveMonth(-1)}
            className="disabled:text-icon-disabled"
          >
            <ChevronLeftIcon size={20} />
          </IconButton>
          <h2
            aria-live="polite"
            className="text-[16px] leading-[22px] font-bold text-text-primary tabular-nums"
          >
            {view.year}년 {view.month}월
          </h2>
          <IconButton
            aria-label="다음 달"
            disabled={!canGoNext}
            onClick={() => moveMonth(1)}
            className="disabled:text-icon-disabled"
          >
            <ChevronLeftIcon size={20} className="rotate-180" />
          </IconButton>
        </div>

        <div
          aria-hidden
          className="mt-1 grid grid-cols-7 text-center text-[12px] leading-[18px]"
        >
          {WEEKDAY_LABELS.map((label, index) => (
            <span key={label} className={weekdayColor(index)}>
              {label}
            </span>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-y-0.5">
          {monthCells(view).map((date, index) =>
            date === null ? (
              <span key={`blank-${index}`} />
            ) : (
              <DayCell
                key={date}
                date={date}
                weekday={index % 7}
                count={byDate.get(date)?.length ?? 0}
                past={date < today}
                isToday={date === today}
                selected={date === selected}
                onSelect={() => setSelected(date)}
              />
            ),
          )}
        </div>
      </section>

      {/* 고른 날 카드 — 목록 보기의 달 카드(#348)와 같은 모양: 머리(날짜)와 대회 줄을 한 면에 담는다. */}
      <section
        aria-label={`${selectedLabel} 대회`}
        className="mx-3 mt-3 rounded-20 bg-surface-field-subtle px-4 pt-4 pb-1"
      >
        <h2
          aria-live="polite"
          className="text-[17px] leading-[24px] font-bold text-text-primary"
        >
          {selectedLabel}
        </h2>
        {selectedItems.length > 0 ? (
          <ul className="flex flex-col pt-1">
            {selectedItems.map((item) => (
              <CompetitionRow
                key={item.competition.id}
                item={item}
                currentYear={currentYear}
                interest={interest}
              />
            ))}
          </ul>
        ) : (
          <p className="pt-1 pb-3 text-[14px] leading-[21px] text-text-secondary">
            {filtered
              ? "이 날은 조건에 맞는 대회가 없어요"
              : "이 날은 대회가 없어요"}
          </p>
        )}
      </section>
    </div>
  );
}

/**
 * 날짜 칸 — 숫자 원 + 아래 점.
 *
 * 고른 날은 파랑 원 채움, 오늘은 옅은 파랑 원(고르지 않았을 때). 지난 날은 흐리게 막는다.
 * 점은 원 밖 아래에 둬 고른 날에도 같은 자리·같은 색으로 보인다.
 */
function DayCell({
  date,
  weekday,
  count,
  past,
  isToday,
  selected,
  onSelect,
}: {
  date: string;
  weekday: number;
  count: number;
  past: boolean;
  isToday: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const day = Number(date.slice(8, 10));
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={past}
      aria-pressed={selected}
      aria-label={`${Number(date.slice(5, 7))}월 ${day}일${isToday ? " 오늘" : ""}${count > 0 ? `, 대회 ${count}개` : ""}`}
      className="flex h-11 flex-col items-center"
    >
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-full text-[15px] leading-none tabular-nums motion-safe:transition-colors motion-safe:duration-120",
          selected
            ? "bg-primary font-bold text-primary-on-primary"
            : cn(
                isToday && "bg-surface-primary-subtle font-bold",
                past ? "text-text-disabled" : weekdayColor(weekday, true),
              ),
        )}
      >
        {day}
      </span>
      <span
        aria-hidden
        className={cn(
          "mt-0.5 size-1 rounded-full",
          count > 0
            ? past
              ? "bg-icon-disabled"
              : "bg-primary"
            : "bg-transparent",
        )}
      />
    </button>
  );
}

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

/** 일요일 빨강 · 토요일 파랑 — 목록의 요일 색과 같다. 평일 날짜는 진하게, 요일 머리는 옅게. */
function weekdayColor(weekday: number, strong = false) {
  if (weekday === 0) return "text-text-error";
  if (weekday === 6) return "text-primary";
  return strong ? "text-text-primary" : "text-text-secondary";
}

/** 달의 칸 — 1일 앞의 빈칸은 null. 날짜는 "YYYY-MM-DD". 요일은 UTC로 계산해 실행 환경 타임존과 무관하다. */
function monthCells({ year, month }: YearMonth): (string | null)[] {
  const leading = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return [
    ...Array.from({ length: leading }, () => null),
    ...Array.from(
      { length: days },
      (_, index) => `${year}-${pad(month)}-${pad(index + 1)}`,
    ),
  ];
}

function yearMonthOf(date: string): YearMonth {
  return { year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)) };
}

function addMonth({ year, month }: YearMonth, delta: 1 | -1): YearMonth {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

function compareYearMonth(a: YearMonth, b: YearMonth) {
  return a.year * 12 + a.month - (b.year * 12 + b.month);
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/** "2026-11-22" → "11월 22일 일요일", 올해가 아니면 연도를 붙인다. */
function dayLabel(date: string, currentYear: number) {
  const { year, month } = yearMonthOf(date);
  const day = Number(date.slice(8, 10));
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const prefix = year === currentYear ? "" : `${year}년 `;
  return `${prefix}${month}월 ${day}일 ${WEEKDAY_LABELS[weekday]}요일`;
}
