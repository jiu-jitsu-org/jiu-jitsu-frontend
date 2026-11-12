"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  CompetitionListChunk,
  CompetitionListItem,
} from "@/features/competition/application/get-competition-list-page-data";
import {
  COMPETITION_FULL_PAGE_SIZE,
  type Competition,
  type CompetitionListQuery,
} from "@/features/competition/domain/competition";
import {
  loadCompetitionListAction,
  type LoadCompetitionListResult,
} from "@/features/competition/presentation/actions/load-competition-list-action";
import { CompetitionRow } from "@/features/competition/presentation/competition-month-section";
import type { CompetitionInterest } from "@/features/competition/presentation/use-competition-interest";
import { cn } from "@/shared/lib/cn";
import { EmptyState } from "@/shared/ui/empty-state";
import { ChevronLeftIcon } from "@/shared/ui/icons";
import { IconButton } from "@/shared/ui/icon-button";

type YearMonth = { year: number; month: number };

/** 달 하나를 받은 결과 — 그 달 대회와, 그 뒤 달에도 대회가 있는지. 못 받았으면 failed. */
type MonthData =
  | { failed: false; items: CompetitionListItem[]; hasLater: boolean }
  | { failed: true };

/**
 * 대회 달력 보기 (#339) — 달 하나를 칸으로 펼치고, 날짜를 고르면 그날 대회를 목록과 같은 줄로 아래에 보여 준다.
 *
 * 대회가 있는 날은 숫자 아래 점 하나로 표시한다. 내 관심 대회가 있는 날은 점을 관심 하트와 같은 빨강으로 칠한다(#396). 대회의 대부분이 토·일에 몰려 주말마다 2~4개가 겹치는데,
 * 칸마다 숫자를 적으면 주말 줄이 숫자로 빽빽해진다. 몇 개인지는 날짜를 누르면 바로 아래에 보인다.
 * 처음에는 오늘 이후 가장 가까운 대회 날을 골라 둔다 — 오늘을 고르면 평일엔 거의 늘 빈 목록부터 보인다.
 *
 * 달마다 서버에서 그 달 1일부터 받는다(#419, date=월초&size=100). 목록의 필터가 그대로 걸린다.
 * 지난 날은 고를 수 없어 이번 달보다 앞으로는 넘기지 않고, 지난 날의 대회도 그리지 않는다.
 * 다음 달은 받은 달 뒤에 대회가 더 있을 때만 넘긴다.
 */
export function CompetitionCalendar({
  query,
  initialDate,
  seekFirstDay = false,
  today,
  currentYear,
  interest,
  interestedOnly,
  filtered,
  onLoad,
}: {
  /** 목록 필터를 옮긴 서버 조회 조건 */
  query: CompetitionListQuery;
  /** 처음 고를 날 — 목록의 첫 대회 날. 없으면 오늘. */
  initialDate: string;
  /**
   * 첫 대회 날을 달력이 찾을지 — 이 조건의 목록을 아직 받지 않았을 때(달력에서 필터를 바꿈).
   * 받은 달에 남은 대회가 없으면 대회가 있는 다음 달까지 넘긴다.
   */
  seekFirstDay?: boolean;
  /** 한국 날짜 "YYYY-MM-DD" */
  today: string;
  currentYear: number;
  interest: CompetitionInterest;
  /** 관심만 보는 중 — 이 화면에서 관심을 끈 대회는 바로 뺀다. */
  interestedOnly: boolean;
  /** 필터가 켜져 있는지 — 빈 날 문구를 "조건에 맞는 대회가 없어요"로 바꾼다. */
  filtered: boolean;
  /** 받은 대회를 관심 상태에 더한다. */
  onLoad: (competitions: Competition[]) => void;
}) {
  const firstMonth = useMemo(() => yearMonthOf(today), [today]);

  const [view, setView] = useState<YearMonth>(() => yearMonthOf(initialDate));
  const [selected, setSelected] = useState<string>(initialDate);
  const queryKey = JSON.stringify(query);
  const monthKey = `${queryKey}|${view.year}-${pad(view.month)}`;
  const [months, setMonths] = useState<Record<string, MonthData>>({});
  const monthData = months[monthKey];

  useEffect(() => {
    if (monthData) return;
    let cancelled = false;
    const monthStart = `${view.year}-${pad(view.month)}-01`;
    void loadCompetitionListAction({
      ...query,
      date: monthStart,
      size: COMPETITION_FULL_PAGE_SIZE,
    })
      // 연결이 끊겨 호출 자체가 실패해도(오프라인·웹뷰 끊김) 같은 실패 갈래로 처리한다.
      .catch((): LoadCompetitionListResult => ({ ok: false, reason: "failed" }))
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          // 못 받은 달은 실패로 남겨 다시 받기를 보여 준다 — 빈 달로 굳지 않게.
          setMonths((current) => ({
            ...current,
            [monthKey]: { failed: true },
          }));
          return;
        }
        onLoad(result.chunk.items.map(({ competition }) => competition));
        setMonths((current) => ({
          ...current,
          [monthKey]: toMonthData(result.chunk, view),
        }));
      });
    return () => {
      cancelled = true;
    };
    // query는 queryKey로 본다 — 같은 조건이면 다시 받지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey, monthData]);

  const byDate = useMemo(() => {
    const map = new Map<string, CompetitionListItem[]>();
    for (const item of monthData && !monthData.failed ? monthData.items : []) {
      if (item.competition.date < today) continue;
      if (interestedOnly && !interest.interestedIds.has(item.competition.id)) {
        continue;
      }
      const list = map.get(item.competition.date);
      if (list) list.push(item);
      else map.set(item.competition.date, [item]);
    }
    return map;
  }, [interest.interestedIds, interestedOnly, monthData, today]);

  // 넘긴 달을 받으면 그 달의 첫 대회 날을 골라 둔다(받기 전에 사용자가 다른 날을 고르면 그대로 둔다).
  const [pendingFirstDay, setPendingFirstDay] = useState(seekFirstDay);
  // 처음 찾는 중이면 남은 대회가 없는 달을 건너뛴다.
  const [seeking, setSeeking] = useState(seekFirstDay);

  const canGoPrev = compareYearMonth(view, firstMonth) > 0;
  const canGoNext = monthData && !monthData.failed ? monthData.hasLater : false;

  const moveMonth = (delta: 1 | -1) => {
    const next = addMonth(view, delta);
    setView(next);
    // 넘긴 달의 첫 대회 날은 받은 뒤에 고른다 — 그 전에는 이번 달이면 오늘, 아니면 1일.
    const prefix = `${next.year}-${pad(next.month)}-`;
    setSelected(
      compareYearMonth(next, firstMonth) === 0 ? today : `${prefix}01`,
    );
    setPendingFirstDay(true);
    setSeeking(false);
  };

  if (pendingFirstDay && monthData) {
    const firstDay = [...byDate.keys()].sort()[0];
    if (firstDay) {
      setSelected(firstDay);
    } else if (seeking && canGoNext) {
      // 다음 달을 받은 뒤 다시 찾는다.
      const next = addMonth(view, 1);
      setView(next);
      setSelected(`${next.year}-${pad(next.month)}-01`);
    }
    if (firstDay || !seeking || !canGoNext) {
      setPendingFirstDay(false);
      setSeeking(false);
    }
  }

  const selectedItems = byDate.get(selected) ?? [];
  const selectedLabel = dayLabel(selected, currentYear);

  return (
    <div className="pb-6">
      <section
        aria-label="대회 달력"
        className="mx-3 mt-1 rounded-20 bg-surface-field px-2 pt-2 pb-3"
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
                interested={
                  byDate
                    .get(date)
                    ?.some(({ competition }) =>
                      interest.isInterested(competition.id),
                    ) ?? false
                }
                past={date < today}
                isToday={date === today}
                selected={date === selected}
                onSelect={() => {
                  setPendingFirstDay(false);
                  setSeeking(false);
                  setSelected(date);
                }}
              />
            ),
          )}
        </div>
      </section>

      {/* 고른 날 대회 — 목록 보기와 같은 대회 줄(#348). 날짜 머리 아래 회색 박스를 늘어놓는다. */}
      <section aria-labelledby={SELECTED_DAY_HEADING_ID} className="px-4 pt-5">
        <h2
          id={SELECTED_DAY_HEADING_ID}
          aria-live="polite"
          className="pb-3 text-[17px] leading-[24px] font-bold text-text-primary"
        >
          {selectedLabel}
        </h2>
        {monthData?.failed ? (
          <EmptyState
            title="대회를 불러오지 못했어요"
            action={{
              label: "다시 시도",
              onClick: () =>
                setMonths((current) => {
                  const next = { ...current };
                  delete next[monthKey];
                  return next;
                }),
            }}
          />
        ) : selectedItems.length > 0 ? (
          <ul className="flex flex-col gap-3">
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
          <p className="text-[14px] leading-[21px] text-text-secondary">
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
 * 점은 원 밖 아래에 둬 고른 날에도 같은 자리·같은 색으로 보인다. 관심 대회가 있는 날은 빨강 점 — 하트 필터를 켜지 않아도
 * 달력에서 내 대회 날이 바로 보인다. 지난 날은 관심이어도 흐린 점이다.
 */
function DayCell({
  date,
  weekday,
  count,
  interested,
  past,
  isToday,
  selected,
  onSelect,
}: {
  date: string;
  weekday: number;
  count: number;
  interested: boolean;
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
      aria-label={`${Number(date.slice(5, 7))}월 ${day}일${isToday ? " 오늘" : ""}${count > 0 ? `, 대회 ${count}개` : ""}${interested ? ", 관심 대회 있음" : ""}`}
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
              : interested
                ? "bg-reaction-bar-active-like-icon"
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

const SELECTED_DAY_HEADING_ID = "competition-calendar-selected-day";

/** 받은 목록에서 이 달 대회만, 그리고 그 뒤 달에 대회가 더 있는지. */
function toMonthData(chunk: CompetitionListChunk, month: YearMonth): MonthData {
  const prefix = `${month.year}-${pad(month.month)}-`;
  return {
    failed: false,
    items: chunk.items.filter(({ competition }) =>
      competition.date.startsWith(prefix),
    ),
    hasLater:
      chunk.nextCursor !== null ||
      chunk.items.some(({ competition }) => competition.date > `${prefix}31`),
  };
}
