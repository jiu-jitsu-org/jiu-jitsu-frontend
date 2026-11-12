"use client";

import { useEffect, useMemo, useState } from "react";

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
  ChevronDownIcon,
  ClearIcon,
} from "@/shared/ui/icons";
import { SURFACE_PRESS } from "@/shared/ui/press-styles";
import { SearchField } from "@/shared/ui/search-field";

/**
 * 글쓰기 대회 고르기 (#367) — '대회' 카테고리를 골랐을 때 카테고리 칩 아래에 나오는 한 칸.
 *
 * 고른 대회는 그 대회 상세의 '대회 이야기'에 이 글을 띄우는 데 쓴다. 대회 전반 질문도 있어 고르지 않아도 된다.
 * 칸은 검색칸과 같은 회색 면(입력칸 공통)이고, 누르면 바텀시트에서 이름으로 찾아 고른다 — 고르면 바로 닫힌다.
 * 다가오는 대회가 가까운 순으로 먼저, 최근 끝난 대회(후기 글)가 그 뒤에 온다.
 * 이름을 치면 서버에서도 찾는다(#421) — 펼친 목록 밖의 지난 대회까지 나온다. 답이 오기 전에는 펼친 목록에서 거른다.
 */
export function CompetitionPicker({
  options,
  value,
  onChange,
  currentYear,
}: {
  options: CompetitionPickerOption[];
  value: number | null;
  onChange: (competitionId: number | null) => void;
  currentYear: number;
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
      <div className="flex h-10 items-center rounded-10 bg-surface-secondary">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className={cn(
            "flex h-full min-w-0 flex-1 items-center gap-2 rounded-10 pr-2 pl-3 text-left text-[15px] leading-[21px]",
            SURFACE_PRESS,
          )}
        >
          <CalendarIcon size={18} className="flex-none text-icon-secondary" />
          {selected ? (
            <span className="min-w-0 flex-1 truncate font-semibold text-text-primary">
              {selected.name}
            </span>
          ) : (
            <span className="min-w-0 flex-1 truncate text-textfield-default-placeholder">
              어떤 대회 이야기인가요? (선택)
            </span>
          )}
          {selected ? null : (
            <ChevronDownIcon
              size={18}
              className="flex-none text-icon-secondary"
            />
          )}
        </button>
        {selected ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={`${selected.name} 고른 것 지우기`}
            className={cn(
              "flex size-10 flex-none items-center justify-center rounded-10 text-icon-secondary",
              SURFACE_PRESS,
            )}
          >
            <ClearIcon size={18} />
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
        <ul className="-mx-2 mt-2 max-h-[50dvh] overflow-y-auto overscroll-contain">
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
                      onChange(option.id);
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
