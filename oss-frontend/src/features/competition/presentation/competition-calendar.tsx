"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  compareYearMonth,
  type YearMonth,
} from "@/features/competition/domain/competition-list-view-state";
import {
  loadCompetitionListAction,
  type LoadCompetitionListResult,
} from "@/features/competition/presentation/actions/load-competition-list-action";
import { retryAfterSessionRefresh } from "@/features/competition/presentation/retry-after-session-refresh";
import { BottomSheetFrame } from "@/features/community/presentation/bottom-sheet-frame";
import { WheelPicker } from "@/features/community/presentation/wheel-picker";
import { trackCompetitionViewChange } from "@/features/competition/presentation/competition-analytics";
import { CompetitionRow } from "@/features/competition/presentation/competition-month-section";
import type { CompetitionInterest } from "@/features/competition/presentation/use-competition-interest";
import { trackErrorShown } from "@/shared/lib/analytics";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { ChevronDownIcon, ChevronLeftIcon, HeartIcon } from "@/shared/ui/icons";
import { IconButton } from "@/shared/ui/icon-button";
import { NEUTRAL_BUTTON_PRESS } from "@/shared/ui/press-styles";
import { TAB_BAR_CLEARANCE } from "@/shared/ui/tab-bar-clearance";
import { lastDayOf } from "@/features/competition/domain/competition-schedule";

/** 달 하나를 받은 결과 — 그 달 대회와, 그 뒤 달에도 대회가 있는지. 못 받았으면 failed. */
type MonthData =
  | { failed: false; items: CompetitionListItem[]; hasLater: boolean }
  | { failed: true };

/** 한 달을 요청해 받은 묶음 — 그 달 1일부터 한 번에(100개). 대회가 적으면 뒤 달까지 들어 있다(#546). */
type FetchedMonth =
  | { failed: false; from: YearMonth; chunk: CompetitionListChunk }
  | { failed: true };

/**
 * 대회 달력 보기 (#339) — 달 하나를 칸으로 펼치고, 날짜를 고르면 그날 대회를 목록과 같은 줄로 아래에 보여 준다.
 *
 * 대회가 있는 날은 숫자 아래 파랑 점 하나로 표시한다. 내 관심 대회가 있는 날은 점 대신 작은 빨강 하트다 — 빨강 점만으로는
 * 파랑 점과 무엇이 다른지 읽히지 않아, 대회 줄·필터 줄의 관심 하트와 같은 모양으로 바꿨다. 대회의 대부분이 토·일에 몰려 주말마다 2~4개가 겹치는데,
 * 칸마다 숫자를 적으면 주말 줄이 숫자로 빽빽해진다. 몇 개인지는 날짜를 누르면 바로 아래에 보인다.
 * 처음에는 오늘 이후 가장 가까운 대회 날을 골라 둔다 — 오늘을 고르면 평일엔 거의 늘 빈 목록부터 보인다.
 *
 * 달마다 서버에서 그 달 1일부터 받는다(#419, date=월초&size=100). 목록의 필터가 그대로 걸린다.
 * 앞 달을 받은 묶음에 이 달이 끝까지 들어 있으면(그 뒤 대회가 있거나 더 받을 게 없음) 새로 받지 않고 그 묶음으로 그린다(#546).
 * 받는 중에는 빈 날 문구 대신 "대회를 찾는 중…"을 보이고, 앞 달에 '뒤에 대회가 더 있음'이면 받는 중에도 다음 달로 넘긴다.
 * 지난 날은 고를 수 없어 이번 달보다 앞으로는 넘기지 않고, 지난 날의 대회도 그리지 않는다.
 * 다음 달은 받은 달 뒤에 대회가 더 있을 때만 넘긴다.
 * 달 머리("2026년 11월 ⌄")를 누르면 연·월 휠 시트가 열려 멀리 있는 달로 바로 간다 — 휠이 가리키는 달의 대회 수를 미리 받아
 * 보여 주고, 아직 대회가 없는 달도 고를 수 있다(빈 달이라고 알려 준다).
 * 보던 달은 넘길 때마다 알려 주고(onMonthChange), 화면이 주소에 담는다 — 당겨서 새로고침하면 그 달로 다시 연다(#539).
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
  initialMonth = null,
  onMonthChange,
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
  /**
   * 처음 열 달 — 주소 쿼리로 연 달력(#539). 주면 initialDate · seekFirstDay 대신 이 달을 열고 그 달의 첫 대회 날을 고른다.
   * chunk는 서버가 미리 받아 둔 그 달(못 받았으면 null — 달력이 받는다).
   */
  initialMonth?: {
    month: YearMonth;
    chunk: CompetitionListChunk | null;
  } | null;
  /** 보던 달이 바뀌면(처음 연 달 포함) 알린다 — 화면이 주소에 담는다. */
  onMonthChange?: (month: YearMonth) => void;
}) {
  const firstMonth = useMemo(() => yearMonthOf(today), [today]);

  const [view, setView] = useState<YearMonth>(
    () => initialMonth?.month ?? yearMonthOf(initialDate),
  );
  const [selected, setSelected] = useState<string>(() =>
    initialMonth ? firstSelectableDay(initialMonth.month, today) : initialDate,
  );
  const queryKey = JSON.stringify(query);
  const monthKey = `${queryKey}|${view.year}-${pad(view.month)}`;
  // 서버가 미리 받아 둔 달이 있으면 그 달은 받지 않고 바로 그린다.
  const [months, setMonths] = useState<Record<string, FetchedMonth>>(() =>
    initialMonth?.chunk
      ? {
          [monthKey]: {
            failed: false,
            from: initialMonth.month,
            chunk: initialMonth.chunk,
          },
        }
      : {},
  );
  /** 이 달을 그릴 결과 — 이 달을 받았으면 그것, 아니면 이 달이 끝까지 들어 있는 앞 달 묶음. 아직 모르면 undefined. */
  const resolveMonth = useCallback(
    (month: YearMonth): MonthData | undefined => {
      const fetched = months[`${queryKey}|${month.year}-${pad(month.month)}`];
      if (fetched) {
        return fetched.failed ? fetched : toMonthData(fetched.chunk, month);
      }
      for (const [key, entry] of Object.entries(months)) {
        if (
          !entry.failed &&
          key.startsWith(`${queryKey}|`) &&
          coversMonth(entry, month)
        ) {
          return toMonthData(entry.chunk, month);
        }
      }
      return undefined;
    },
    [months, queryKey],
  );
  const monthData = useMemo(() => resolveMonth(view), [resolveMonth, view]);
  // 달 받기 실패 안내가 보일 때 오류 기록(#583) — 같은 달 · 같은 조건에서 다시 시도가 또 실패해도 한 번만
  // (다시 시도는 받은 묶음을 지워 실패 표시가 잠깐 사라진다). 다른 달로 갔다가 다시 실패하면 다시 센다.
  const monthFailed = monthData?.failed === true;
  const trackedFailureKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!monthFailed || trackedFailureKeyRef.current === monthKey) return;
    trackedFailureKeyRef.current = monthKey;
    trackErrorShown({ contentType: "competition" });
  }, [monthFailed, monthKey]);
  // 받기 전에 이미 받은 묶음을 본다 — 받기 함수를 새로 만들면 달 고르기 시트의 휠 기다림이 다시 시작돼 ref로 읽는다.
  const resolveMonthRef = useRef(resolveMonth);
  useEffect(() => {
    resolveMonthRef.current = resolveMonth;
  }, [resolveMonth]);
  // 받았거나 받는 중인 달 — 달력과 달 고르기 시트가 같은 달을 두 번 받지 않게. 실패한 달은 빼서 다시 받을 수 있다.
  const requestedKeys = useRef(
    new Set<string>(initialMonth?.chunk ? [monthKey] : []),
  );

  // 보던 달을 알린다 — 화면이 주소에 담는다(#539).
  useEffect(() => {
    onMonthChange?.({ year: view.year, month: view.month });
    // 달이 바뀔 때만 알린다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.year, view.month]);

  const loadMonth = useCallback(
    (month: YearMonth) => {
      const key = `${queryKey}|${month.year}-${pad(month.month)}`;
      if (requestedKeys.current.has(key)) return;
      // 앞 달 묶음에 이 달이 끝까지 들어 있으면 받지 않는다(#546).
      const known = resolveMonthRef.current(month);
      if (known && !known.failed) return;
      requestedKeys.current.add(key);
      // 토큰이 만료됐으면 앱 갱신 뒤 한 번 다시 받는다 — 익명으로 받아 관심 상태를 덮지 않게(#524).
      void retryAfterSessionRefresh(() =>
        loadCompetitionListAction({
          ...query,
          date: `${month.year}-${pad(month.month)}-01`,
          size: COMPETITION_FULL_PAGE_SIZE,
        }),
      )
        // 연결이 끊겨 호출 자체가 실패해도(오프라인·웹뷰 끊김) 같은 실패 갈래로 처리한다.
        .catch((): LoadCompetitionListResult => ({
          ok: false,
          reason: "failed",
        }))
        .then((result) => {
          if (!result.ok) {
            requestedKeys.current.delete(key);
            // 못 받은 달은 실패로 남겨 다시 받기를 보여 준다 — 빈 달로 굳지 않게.
            setMonths((current) => ({ ...current, [key]: { failed: true } }));
            return;
          }
          // 달을 먼저 채운다 — 관심 상태에 더하다 실패해도 달력이 빈 달로 멈추지 않게.
          setMonths((current) => ({
            ...current,
            [key]: { failed: false, from: month, chunk: result.chunk },
          }));
          onLoad(result.chunk.items.map(({ competition }) => competition));
        });
    },
    // query는 queryKey로 본다 — 같은 조건이면 다시 받지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryKey],
  );

  useEffect(() => {
    if (!monthData) loadMonth(view);
    // view는 monthKey에 담겨 있다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey, monthData, loadMonth]);

  /** 이 달에서 달력에 그릴 대회 — 끝난 대회와(관심만 볼 때) 관심이 아닌 대회를 뺀다. 아직 못 받았으면 null. */
  const shownItemsOf = useCallback(
    (data: MonthData | undefined): CompetitionListItem[] | null => {
      if (!data || data.failed) return null;
      return data.items.filter(
        ({ competition }) =>
          // 여러 날 대회는 마지막 날까지 첫날 칸에 남긴다 — 상세가 '오늘 대회'인 동안 달력에서 사라지지 않게.
          lastDayOf(competition) >= today &&
          (!interestedOnly || interest.interestedIds.has(competition.id)),
      );
    },
    [interest.interestedIds, interestedOnly, today],
  );

  const byDate = useMemo(() => {
    const map = new Map<string, CompetitionListItem[]>();
    for (const item of shownItemsOf(monthData) ?? []) {
      const list = map.get(item.competition.date);
      if (list) list.push(item);
      else map.set(item.competition.date, [item]);
    }
    return map;
  }, [monthData, shownItemsOf]);

  // 넘긴 달을 받으면 그 달의 첫 대회 날을 골라 둔다(받기 전에 사용자가 다른 날을 고르면 그대로 둔다).
  const [pendingFirstDay, setPendingFirstDay] = useState(
    seekFirstDay || initialMonth !== null,
  );
  // 처음 찾는 중이면 남은 대회가 없는 달을 건너뛴다. 보던 달로 열 때는 그 달에 머문다.
  const [seeking, setSeeking] = useState(seekFirstDay && initialMonth === null);

  const canGoPrev = compareYearMonth(view, firstMonth) > 0;
  // 받는 중에는 앞서 받은 가장 가까운 달이 '뒤에 대회가 더 있음'이면 넘길 수 있다 — 받기를 기다리지 않고 연달아 넘기게(#546).
  const canGoNext = monthData
    ? !monthData.failed && monthData.hasLater
    : hasLaterBefore(view, firstMonth, resolveMonth);

  const [pickerOpen, setPickerOpen] = useState(false);

  const moveMonth = (delta: 1 | -1) => {
    trackCompetitionViewChange(
      "calendar",
      delta === 1 ? "next_month" : "prev_month",
    );
    goToMonth(addMonth(view, delta));
  };

  const goToMonth = (next: YearMonth) => {
    setView(next);
    // 넘긴 달의 첫 대회 날은 받은 뒤에 고른다 — 그 전에는 이번 달이면 오늘, 아니면 1일.
    setSelected(firstSelectableDay(next, today));
    setPendingFirstDay(true);
    setSeeking(false);
  };

  // 못 받은 달에서는 기다린다 — '다시 시도'로 받으면 그때 첫 대회 날을 고른다.
  if (pendingFirstDay && monthData && !monthData.failed) {
    const firstDay = [...byDate.keys()].sort()[0];
    if (firstDay) {
      setSelected(firstDay);
    } else if (seeking && monthData.hasLater) {
      // 다음 달을 받은 뒤 다시 찾는다.
      const next = addMonth(view, 1);
      setView(next);
      setSelected(`${next.year}-${pad(next.month)}-01`);
    }
    if (firstDay || !seeking || !monthData.hasLater) {
      setPendingFirstDay(false);
      setSeeking(false);
    }
  }

  const selectedItems = byDate.get(selected) ?? [];
  const selectedLabel = dayLabel(selected, currentYear);

  return (
    // relative: 위에 깔린 띠 색 그라데이션(CompetitionTopTint, absolute·z 없음)보다 위에 그린다(#466).
    // 위치 지정이 없으면 CSS 그리는 순서상 그라데이션 아래로 깔려 달력 위쪽이 덮인다 — 목록의 달 묶음과 같은 방식.
    // 끝 여백은 홈 피드와 같은 탭 바 여백 — 고른 날의 마지막 대회가 앱 탭 바에 가리지 않게(#487).
    <div className={cn("relative", TAB_BAR_CLEARANCE)}>
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
          {/* 달 머리를 누르면 연·월 휠 시트 — 화살표로 한 달씩 넘기지 않고 멀리 있는 달로 바로 간다. */}
          <h2>
            {/* 달이 바뀌면 달 이름만 읽어 준다 — 버튼 이름("…, 다른 달 고르기")까지 매번 읽지 않게. */}
            <span aria-live="polite" className="sr-only">
              {view.year}년 {view.month}월
            </span>
            <button
              type="button"
              aria-haspopup="dialog"
              aria-label={`${view.year}년 ${view.month}월, 다른 달 고르기`}
              data-ga="month_picker"
              onClick={() => setPickerOpen(true)}
              className={cn(
                "flex h-10 items-center gap-1 rounded-10 px-2 text-[17px] leading-[24px] font-bold text-text-primary tabular-nums",
                NEUTRAL_BUTTON_PRESS,
              )}
            >
              {view.year}년 {view.month}월
              <ChevronDownIcon size={16} className="text-icon-secondary" />
            </button>
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

        <div className="mt-2 grid grid-cols-7 gap-y-1">
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
                  trackCompetitionViewChange("calendar", "pick_date");
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
              ga: "retry",
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
                interestFrom="competition_calendar"
              />
            ))}
          </ul>
        ) : (
          <p className="text-[14px] leading-[21px] text-text-secondary">
            {/* 아직 받는 중이면 빈 날이라고 하지 않는다(#546) — 달 고르기 시트와 같은 말. */}
            {monthData
              ? emptyMessage(byDate.size === 0 ? "month" : "day", filtered)
              : LOADING_MESSAGE}
          </p>
        )}
      </section>

      <BottomSheetFrame
        open={pickerOpen}
        title="어느 달 대회를 볼까요?"
        onDismiss={() => setPickerOpen(false)}
      >
        <MonthPickerBody
          initial={view}
          firstMonth={firstMonth}
          filtered={filtered}
          countOf={(month) => {
            const shown = shownItemsOf(resolveMonth(month));
            return shown === null ? null : shown.length;
          }}
          failedOf={(month) => resolveMonth(month)?.failed === true}
          onPeek={loadMonth}
          onPick={(month) => {
            setPickerOpen(false);
            if (compareYearMonth(month, view) === 0) return;
            trackCompetitionViewChange("calendar", "pick_month");
            goToMonth(month);
          }}
        />
      </BottomSheetFrame>
    </div>
  );
}

/** 달을 아직 받는 중일 때 문구 — 달 고르기 시트와 같은 말. */
const LOADING_MESSAGE = "대회를 찾는 중…";

/** 빈 날 문구 — 달 전체가 비었으면 달 기준으로 말한다(아직 대회가 올라오지 않은 달). */
function emptyMessage(scope: "day" | "month", filtered: boolean) {
  if (scope === "month") {
    return filtered
      ? "이 달은 조건에 맞는 대회가 없어요"
      : "이 달은 아직 올라온 대회가 없어요";
  }
  return filtered
    ? "이 날은 조건에 맞는 대회가 없어요"
    : "이 날은 대회가 없어요";
}

/** 휠로 볼 수 있는 해 — 올해와 내년. 대회는 길어야 몇 달 앞까지 올라온다. */
const PICKER_YEAR_SPAN = 2;

/** 휠이 멈춘 뒤 그 달 대회 수를 받기까지 기다리는 시간(ms) — 굴리는 동안 달마다 받지 않게. */
const PEEK_DELAY_MS = 250;

/**
 * 달 고르기 시트 안쪽 — 왼쪽 연도 · 오른쪽 월 휠(띠 고르기 시트와 같은 휠·같은 배치) + 그 달 대회 수 + 이동 버튼.
 *
 * 지난 달은 고를 수 없다(달력이 지난 날을 막는 것과 같다) — 올해를 고르면 월 휠은 이번 달부터다.
 * 휠이 가리키는 달의 대회 수를 미리 받아 아래 한 줄로 알려 준다. 아직 대회가 없는 달도 고를 수 있다.
 * 열 때마다 새로 마운트돼 지금 보는 달에서 시작한다.
 */
function MonthPickerBody({
  initial,
  firstMonth,
  filtered,
  countOf,
  failedOf,
  onPeek,
  onPick,
}: {
  initial: YearMonth;
  firstMonth: YearMonth;
  filtered: boolean;
  /** 그 달에 달력이 그릴 대회 수 — 아직 못 받았으면 null. */
  countOf: (month: YearMonth) => number | null;
  failedOf: (month: YearMonth) => boolean;
  /** 그 달을 미리 받아 둔다(받았거나 받는 중이면 아무것도 안 한다). */
  onPeek: (month: YearMonth) => void;
  onPick: (month: YearMonth) => void;
}) {
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const years = Array.from(
    { length: Math.max(PICKER_YEAR_SPAN, initial.year - firstMonth.year + 1) },
    (_, index) => firstMonth.year + index,
  );
  const firstMonthOfYear = year === firstMonth.year ? firstMonth.month : 1;
  const monthsOfYear = Array.from(
    { length: 13 - firstMonthOfYear },
    (_, index) => firstMonthOfYear + index,
  );
  // 해를 바꿔 지난 달을 가리키게 되면 이번 달로 당긴다.
  const shownMonth = Math.max(month, firstMonthOfYear);
  const picked = { year, month: shownMonth };

  useEffect(() => {
    const timer = window.setTimeout(
      () => onPeek({ year, month: shownMonth }),
      PEEK_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [year, shownMonth, onPeek]);

  const count = countOf(picked);
  const status = failedOf(picked)
    ? "대회 수를 불러오지 못했어요"
    : count === null
      ? LOADING_MESSAGE
      : count > 0
        ? `대회 ${count}개`
        : filtered
          ? "조건에 맞는 대회가 없어요"
          : "아직 올라온 대회가 없어요";

  return (
    <>
      {/* 좌우 휠: 왼쪽 연도 · 오른쪽 월, 사이 24, 가운데 정렬(띠 고르기 시트와 같은 배치). */}
      <div className="mt-5 flex justify-center gap-6">
        <WheelPicker
          label="연도"
          items={years}
          value={year}
          getLabel={(value) => `${value}년`}
          onChange={setYear}
        />
        <WheelPicker
          // 해마다 고를 수 있는 달이 달라 새로 그린다 — 휠은 처음 뜰 때만 값 자리로 굴러간다.
          key={firstMonthOfYear}
          label="월"
          items={monthsOfYear}
          value={shownMonth}
          getLabel={(value) => `${value}월`}
          onChange={setMonth}
        />
      </div>

      <p
        aria-live="polite"
        className={cn(
          "mt-4 text-center text-[14px] leading-[21px] tabular-nums",
          count !== null && count > 0
            ? "font-medium text-text-primary"
            : "text-text-secondary",
        )}
      >
        {status}
      </p>

      {/* 하단 CTA: SelectSheet와 같은 높이 51 · radius 15. */}
      <Button
        variant="cta"
        size="l"
        onClick={() => onPick(picked)}
        className="mt-5 w-full"
      >
        {year}년 {shownMonth}월 보기
      </Button>
    </>
  );
}

/**
 * 날짜 칸 — 숫자 원 + 아래 표시(대회 있는 날 파랑 점 · 관심 대회 있는 날 빨강 하트).
 *
 * 고른 날은 파랑 원 채움, 오늘은 한 단계 진한 옅은 파랑 원(고르지 않았을 때) — 달력 바탕 회색(cool-gray-25) 위에서
 * 가장 옅은 파랑(blue-50)은 밝기가 거의 같아 보이지 않았다. 지난 날은 흐리게 막는다.
 * 표시는 원 밖 아래에 둬 고른 날에도 같은 자리·같은 색으로 보인다. 관심 대회가 있는 날은 하트 — 하트 필터를 켜지 않아도
 * 달력에서 내 대회 날이 바로 보이고, 대회 줄의 관심 하트와 같은 모양이라 뜻이 읽힌다. 지난 날은 흐린 색이다.
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
      className="flex h-[54px] flex-col items-center"
    >
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-full text-[16px] leading-none tabular-nums motion-safe:transition-colors motion-safe:duration-120",
          selected
            ? "bg-primary font-bold text-primary-on-primary"
            : cn(
                // 오늘은 요일 색(일 빨강·토 파랑) 대신 진한 글자 — 파랑 면 위 빨강 숫자는 고른 날처럼 튀어 보인다.
                isToday
                  ? "bg-primary-subtle font-bold text-text-primary"
                  : past
                    ? "text-text-disabled"
                    : weekdayColor(weekday, true),
              ),
        )}
      >
        {day}
      </span>
      <span aria-hidden className="mt-1 flex h-2.5 items-center">
        {count === 0 ? null : interested ? (
          <HeartIcon
            filled
            size={10}
            className={
              past ? "text-icon-disabled" : "text-reaction-bar-active-like-icon"
            }
          />
        ) : (
          <span
            className={cn(
              "size-[5px] rounded-full",
              past ? "bg-icon-disabled" : "bg-primary",
            )}
          />
        )}
      </span>
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

/** 달을 연 뒤 대회를 받기 전에 골라 둘 날 — 이번 달이면 오늘, 아니면 1일. */
function firstSelectableDay(month: YearMonth, today: string): string {
  return compareYearMonth(month, yearMonthOf(today)) === 0
    ? today
    : `${month.year}-${pad(month.month)}-01`;
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

/**
 * 앞 달부터 받은 묶음에 이 달이 끝까지 들어 있는지 — 목록은 날짜순이라 이 달보다 뒤 대회가 하나라도 있거나
 * 더 받을 게 없으면(다음 커서 없음) 이 달 대회는 모두 들어 있다.
 */
function coversMonth(
  fetched: { from: YearMonth; chunk: CompetitionListChunk },
  month: YearMonth,
): boolean {
  if (compareYearMonth(month, fetched.from) < 0) return false;
  const monthEnd = `${month.year}-${pad(month.month)}-31`;
  return (
    fetched.chunk.nextCursor === null ||
    fetched.chunk.items.some(({ competition }) => competition.date > monthEnd)
  );
}

/** 받는 중인 달에서 다음 달로 넘길 수 있는지 — 앞서 받은 가장 가까운 달이 '뒤에 대회가 더 있음'인지. */
function hasLaterBefore(
  view: YearMonth,
  firstMonth: YearMonth,
  resolveMonth: (month: YearMonth) => MonthData | undefined,
): boolean {
  for (
    let month = addMonth(view, -1);
    compareYearMonth(month, firstMonth) >= 0;
    month = addMonth(month, -1)
  ) {
    const data = resolveMonth(month);
    if (data) return !data.failed && data.hasLater;
  }
  return false;
}

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
