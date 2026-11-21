"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { BottomSheetFrame } from "@/features/community/presentation/bottom-sheet-frame";
import type { CompetitionPickerOption } from "@/features/competition/application/get-competition-picker-options";
import {
  hasNameQuery,
  matchesCompetitionName,
} from "@/features/competition/domain/competition-filter";
import { searchCompetitionPickerAction } from "@/features/competition/presentation/actions/search-competition-picker-action";
import { longDateLabel } from "@/features/competition/presentation/competition-detail-format";
import { cn } from "@/shared/lib/cn";
import {
  CalendarIcon,
  CheckIcon,
  ClearIcon,
  SearchIcon,
} from "@/shared/ui/icons";
import { SURFACE_PRESS } from "@/shared/ui/press-styles";
import { SearchField } from "@/shared/ui/search-field";

/**
 * 글쓰기 대회 고르기 (#367) — '대회' 카테고리를 골랐을 때 접힌 카테고리 칩 줄에서 '대회' 칩 오른쪽 남은 폭에 들어오는 한 칸.
 *
 * 고른 대회는 그 대회 상세의 '대회 이야기'에 이 글을 띄우는 데 쓴다. 대회 전반 질문도 있어 고르지 않아도 된다.
 * 칸은 검색칸과 같은 옅은 회색 면이고, 누르면 바텀시트에서 이름으로 찾아 고른다 — 고르면 바로 닫힌다.
 * 다가오는 대회가 가까운 순으로 먼저, 최근 끝난 대회(후기 글)가 그 뒤에 온다.
 * 이름을 치면 서버에서도 찾는다(#421) — 펼친 목록 밖의 지난 대회까지 나온다. 답이 오기 전에는 펼친 목록에서 거른다.
 *
 * 홈 피드 '대회' 탭도 같은 칸으로 대회별 글을 고른다 — 고르기 전 묻는 말(placeholder)만 다르다.
 */
export function CompetitionPicker({
  options,
  value,
  onChange,
  currentYear,
  trackClicks = true,
  // 글쓰기 — 고르지 않아도 된다는 건 화면엔 빼고 읽어 줄 때만 붙인다.
  placeholder = (
    <>
      대회 찾기<span className="sr-only"> (선택)</span>
    </>
  ),
}: {
  options: CompetitionPickerOption[];
  value: number | null;
  /**
   * pickedBy: 펼친 목록에서 골랐나, 이름을 쳐서 찾아 골랐나 — 글 등록 기록(GA, #619)의 competition_pick.
   * option: 고른 대회(지우면 없음) — 검색으로 찾은 대회도 이름 · 날짜를 알 수 있게.
   */
  onChange: (
    competitionId: number | null,
    pickedBy?: "list" | "search",
    option?: CompetitionPickerOption,
  ) => void;
  currentYear: number;
  /** 고르기 전 칸에 보이는 묻는 말. */
  placeholder?: ReactNode;
  /** 이름 없는 누름 기록(data-ga) — 고르기 · 지우기에 이름 붙은 이벤트를 따로 남기는 화면(홈 피드)은 끈다. */
  trackClicks?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  // 서버에서 찾은 결과 — 어떤 검색어의 답인지 함께 들어, 검색어가 바뀌면 지난 답을 쓰지 않는다.
  const [found, setFound] = useState<{
    query: string;
    options: CompetitionPickerOption[];
  } | null>(null);
  // 고른 대회가 검색으로만 찾은 대회여도 칸에 이름이 보이게 기억해 둔다.
  const [picked, setPicked] = useState<CompetitionPickerOption | null>(null);
  const selected =
    options.find((option) => option.id === value) ??
    (picked?.id === value ? picked : null);
  const searching = hasNameQuery(query);
  useEffect(() => {
    if (!searching) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      // 찾기에 실패하면(연결 끊김 포함) 펼친 목록 안에서 거른 결과를 그대로 둔다.
      void searchCompetitionPickerAction(query)
        .catch(() => null)
        .then((result) => {
          if (!cancelled && result) setFound({ query, options: result });
        });
    }, SEARCH_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, searching]);
  const shown = useMemo(
    () =>
      found && found.query === query
        ? found.options
        : options.filter((option) =>
            matchesCompetitionName(option.name, query),
          ),
    [found, options, query],
  );

  function close() {
    setOpen(false);
    setQuery("");
  }

  return (
    <>
      {/* 옅은 회색 면(옆 안 고른 칩과 같은 surface-field — 검색칸의 surface-secondary는 칩 옆에서 짙어 보였다) — 누르면 이름으로 찾는 시트가 열린다. 옆 칩과 한 줄에 서도록 높이 32 · 둥근 끝.
          고르기 전에는 돋보기 + 짧은 안내(고르지 않아도 된다), 고르면 달력 + 대회 이름을 굵게 + 지우기. */}
      <div className="flex h-8 items-center rounded-full bg-surface-field">
        <button
          type="button"
          data-ga={trackClicks ? "competition_picker" : undefined}
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          // 고르기 전에는 칸 글자(묻는 말)를 그대로 읽는다.
          aria-label={selected ? `${selected.name}, 대회 바꾸기` : undefined}
          className={cn(
            "flex h-full min-w-0 flex-1 items-center gap-1.5 rounded-full pr-3 pl-3 text-left text-[14px] leading-[20px]",
            SURFACE_PRESS,
          )}
        >
          {selected ? (
            <>
              <CalendarIcon
                size={16}
                className="flex-none text-icon-secondary"
              />
              <span className="min-w-0 flex-1 truncate font-semibold text-text-primary">
                {selected.name}
              </span>
            </>
          ) : (
            <>
              <SearchIcon size={16} className="flex-none text-icon-secondary" />
              <span className="min-w-0 flex-1 truncate text-text-tertiary">
                {placeholder}
              </span>
            </>
          )}
        </button>
        {selected ? (
          <button
            type="button"
            data-ga={trackClicks ? "competition_clear" : undefined}
            onClick={() => onChange(null)}
            aria-label={`${selected.name} 고른 것 지우기`}
            className={cn(
              "flex h-full w-9 flex-none items-center justify-center rounded-full text-icon-secondary",
              SURFACE_PRESS,
            )}
          >
            <ClearIcon size={16} />
          </button>
        ) : null}
      </div>

      <BottomSheetFrame open={open} title="대회 고르기" onDismiss={close}>
        <SearchField
          value={query}
          onValueChange={setQuery}
          onEscape={close}
          placeholder="대회 이름으로 찾기"
          aria-label="대회 이름으로 찾기"
          className="mt-1"
        />
        {/* 목록 높이는 고정 — 검색으로 결과가 줄어도 시트 키가 그대로라 검색칸이 손가락 밑에서 내려가지 않는다(#467).
            키보드가 떠서 보이는 영역이 모자라면 시트가 줄어드는 만큼 이 목록이 줄어든다(min-h-0). */}
        <ul className="-mx-2 mt-2 h-[50dvh] min-h-0 overflow-y-auto overscroll-contain">
          {shown.length === 0 ? (
            <li className="py-8 text-center text-[14px] leading-[20px] text-text-secondary">
              찾는 대회가 없어요
            </li>
          ) : (
            shown.map((option) => {
              const on = option.id === value;
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setPicked(option);
                      onChange(
                        option.id,
                        searching ? "search" : "list",
                        option,
                      );
                      close();
                    }}
                    className={cn(
                      "flex min-h-14 w-full items-center gap-3 rounded-10 px-2 py-2 text-left",
                      SURFACE_PRESS,
                    )}
                  >
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span
                        className={cn(
                          "text-[15px] leading-[21px] font-semibold break-keep",
                          on ? "text-primary" : "text-text-primary",
                        )}
                      >
                        {option.name}
                      </span>
                      <span className="text-[13px] leading-[18px] text-text-secondary">
                        {[
                          option.date
                            ? longDateLabel(option.date, currentYear)
                            : null,
                          option.place.trim(),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                    {on ? (
                      <CheckIcon size={20} className="flex-none text-primary" />
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </BottomSheetFrame>
    </>
  );
}

/** 치는 동안 서버를 매 글자 부르지 않게 잠깐 기다린다(ms). */
const SEARCH_DELAY_MS = 300;
