"use client";

import { useEffect, useMemo, useState } from "react";

import { useIsSignedIn } from "@/features/auth/presentation/auth-provider";
import { useLoginGuard } from "@/features/community/presentation/use-login-guard";
import type { CompetitionListMonth } from "@/features/competition/application/get-competition-list-page-data";
import {
  closingSoonInterested,
  type ClosingSoonItem,
} from "@/features/competition/domain/competition-closing-soon";
import {
  EMPTY_COMPETITION_FILTER,
  hasNameQuery,
  isCompetitionFilterEmpty,
  matchesCompetitionFilter,
  type CompetitionFilter,
} from "@/features/competition/domain/competition-filter";
import type { CompetitionRegion } from "@/features/competition/domain/competition-region";
import { CompetitionCalendar } from "@/features/competition/presentation/competition-calendar";
import { CompetitionClosingSoonBanner } from "@/features/competition/presentation/competition-closing-soon-banner";
import { RegistrationIcon } from "@/features/competition/presentation/competition-icons";
import {
  MonthSection,
  competitionRowId,
} from "@/features/competition/presentation/competition-month-section";
import { CompetitionRegionSheet } from "@/features/competition/presentation/competition-region-sheet";
import { CompetitionSearchField } from "@/features/competition/presentation/competition-search-field";
import { useCompetitionInterest } from "@/features/competition/presentation/use-competition-interest";
import {
  CalendarIcon,
  ChevronDownIcon,
  ListIcon,
  SearchIcon,
} from "@/shared/ui";
import { Chip } from "@/shared/ui/chip";
import { EmptyState } from "@/shared/ui/empty-state";
import { IconButton } from "@/shared/ui/icon-button";

/**
 * 대회 목록 + 위 필터 줄 (#334) — 관심 · 지역 · 접수 중 · 노기.
 *
 * 목록은 서버가 한 번에 다 보내고 거르기는 여기서 한다 — 대회 수가 한 해 수백 건이라 칩을 누를 때마다
 * 서버를 다시 부르지 않는다. 필터 줄은 목록을 내려도 위에 붙어 있어 언제든 바꿀 수 있다.
 * 걸러서 대회가 하나도 없는 달은 달 이름까지 뺀다.
 *
 * 관심은 로그인한 사용자만 갖는다. 비로그인이 누르면 다른 화면의 좋아요와 같은 로그인 안내를 띄우고
 * (외부 브라우저면 앱 안내), 필터는 켜지 않는다 — 켜 봐야 늘 빈 결과다.
 */
export function CompetitionListView({
  months,
  currentYear,
  today,
  interestedIds,
  interestCounts,
  regionsWithCompetitions,
}: {
  months: CompetitionListMonth[];
  currentYear: number;
  /** 한국 날짜 "YYYY-MM-DD" — 달력 보기용. */
  today: string;
  interestedIds: string[];
  interestCounts: Record<string, number>;
  regionsWithCompetitions: CompetitionRegion[];
}) {
  const [filter, setFilter] = useState<CompetitionFilter>(
    EMPTY_COMPETITION_FILTER,
  );
  const [regionSheetOpen, setRegionSheetOpen] = useState(false);
  // 시트를 열 때마다 key를 바꿔 고르던 값을 지금 필터로 다시 시작한다.
  const [regionSheetKey, setRegionSheetKey] = useState(0);
  // 기본은 목록이다 — 대회가 거의 토·일에 몰려 달력을 먼저 펼치면 빈 칸이 대부분이다(#339).
  const [mode, setMode] = useState<"list" | "calendar">("list");
  // 이름 검색(#345)은 돋보기를 눌러야 열린다. 닫으면 검색어도 지운다 — 안 보이는 검색어로 걸러지지 않게.
  const [searchOpen, setSearchOpen] = useState(false);

  const signedIn = useIsSignedIn();
  const { guard } = useLoginGuard();
  const interest = useCompetitionInterest({ interestedIds, interestCounts });

  // 로그아웃했거나 세션이 만료돼 비로그인으로 판정되면 켜 두었던 관심 필터는 풀린 것으로 본다 —
  // 남겨 두면 이전 관심 목록으로 거르거나 늘 빈 결과만 보인다.
  const activeFilter = useMemo(
    () => (signedIn ? filter : { ...filter, interestedOnly: false }),
    [filter, signedIn],
  );

  const visibleMonths = useMemo(() => {
    if (isCompetitionFilterEmpty(activeFilter)) return months;
    return months
      .map((month) => ({
        ...month,
        items: month.items.filter((item) =>
          matchesCompetitionFilter(item, activeFilter, interest.interestedIds),
        ),
      }))
      .filter((month) => month.items.length > 0);
    // 관심은 이 화면에서 누른 결과까지 반영한 값으로 거른다 — 관심만 보는 중에 해제하면 바로 빠진다.
  }, [activeFilter, interest.interestedIds, months]);

  // 관심 대회 마감 배너(#344) — 필터와 무관하게 내 관심 대회 전체에서 고른다. 비로그인이면 관심이 없어 비어 있다.
  const closingSoon = useMemo(
    () =>
      signedIn
        ? closingSoonInterested(
            months.flatMap((month) => month.items),
            interest.interestedIds,
          )
        : [],
    [interest.interestedIds, months, signedIn],
  );

  // 배너에서 누른 대회. seq는 같은 대회를 다시 눌러도 다시 움직이게 하려고 둔다.
  const [focus, setFocus] = useState<{
    id: string;
    date: string;
    seq: number;
  } | null>(null);

  useEffect(() => {
    if (!focus) return;
    // 목록이면 그 대회 줄로, 달력이면 다시 그린 달력 아래 그날 대회 줄로 내려간다(둘 다 같은 줄을 쓴다).
    const row = document.getElementById(competitionRowId(focus.id));
    if (!row) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    // 위에 붙은 필터 줄(검색칸이 열리면 더 높다) 바로 아래에 오게 그 높이만큼 띄운다.
    const barHeight = document.getElementById(FILTER_BAR_ID)?.offsetHeight ?? 0;
    window.scrollTo({
      top: row.getBoundingClientRect().top + window.scrollY - barHeight - 8,
      behavior: reduce ? "auto" : "smooth",
    });
    // 스크린리더·키보드도 이동한 곳에서 이어 가게 초점을 옮긴다(스크롤은 위에서 이미 했다).
    row.focus({ preventScroll: true });
  }, [focus]);

  const focusCompetition = ({ competition }: ClosingSoonItem) => {
    // 켜 둔 필터에 걸려 안 보이는 대회면 필터를 풀어야 갈 수 있다.
    const visible = visibleMonths.some((month) =>
      month.items.some((item) => item.competition.id === competition.id),
    );
    if (!visible) setFilter(EMPTY_COMPETITION_FILTER);
    setFocus((current) => ({
      id: competition.id,
      date: competition.date,
      seq: (current?.seq ?? 0) + 1,
    }));
  };

  const toggle = (key: "interestedOnly" | "openOnly" | "nogiOnly") =>
    setFilter((current) => ({ ...current, [key]: !current[key] }));

  const toggleInterested = () => toggle("interestedOnly");

  const setNameQuery = (nameQuery: string) =>
    setFilter((current) => ({ ...current, nameQuery }));

  const closeSearch = () => {
    setSearchOpen(false);
    setNameQuery("");
    // 입력칸이 사라지면 초점이 화면 맨 앞으로 튀지 않게 돋보기로 돌려준다.
    document.getElementById(SEARCH_BUTTON_ID)?.focus();
  };

  // 검색어만 걸려서 비었으면 검색어 탓이라고 말하고, 검색어만 지우게 한다.
  const emptyBySearchOnly =
    hasNameQuery(filter.nameQuery) &&
    isCompetitionFilterEmpty({ ...activeFilter, nameQuery: "" });

  return (
    <>
      {/* 필터 줄: 좌우 16 · 칩 간격 8, 넘치면 가로 스크롤(스크롤바 숨김) — 글쓰기 카테고리 칩 줄과 같은 규격.
          목록 바탕과 같은 면이라 붙어 있어도 선이 따로 필요 없다.
          오른쪽 끝에 목록 ↔ 달력 전환(#339)을 고정해 둔다 — 칩이 늘어 가로로 밀어도 늘 같은 자리에 있게. */}
      <div
        id={FILTER_BAR_ID}
        className="sticky top-0 z-10 bg-surface-container"
      >
        <div className="flex items-center">
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto py-3 pr-2 pl-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Chip
              tone="primary"
              selected={activeFilter.interestedOnly}
              aria-pressed={activeFilter.interestedOnly}
              onClick={
                signedIn
                  ? toggleInterested
                  : guard(
                      toggleInterested,
                      "관심 대회는 OSS 앱에서 로그인 후 볼 수 있어요.",
                    )
              }
            >
              관심
            </Chip>
            <Chip
              tone="primary"
              selected={filter.regions.length > 0}
              aria-haspopup="dialog"
              // 시트를 여는 칩이라 aria-pressed 대신 이름에 고른 지역을 담는다.
              aria-label={
                filter.regions.length > 0
                  ? `지역: ${filter.regions.join(", ")}`
                  : "지역: 전체"
              }
              onClick={() => {
                setRegionSheetKey((key) => key + 1);
                setRegionSheetOpen(true);
              }}
              className="gap-0.5 pr-2"
            >
              {regionLabel(filter.regions)}
              <ChevronDownIcon size={16} />
            </Chip>
            <Chip
              tone="primary"
              selected={filter.openOnly}
              aria-pressed={filter.openOnly}
              onClick={() => toggle("openOnly")}
              className="gap-1 pl-2.5"
            >
              <RegistrationIcon stage="open" size={16} />
              접수 중
            </Chip>
            <Chip
              tone="primary"
              selected={filter.nogiOnly}
              aria-pressed={filter.nogiOnly}
              onClick={() => toggle("nogiOnly")}
            >
              노기
            </Chip>
          </div>
          <IconButton
            id={SEARCH_BUTTON_ID}
            aria-label="대회 이름 검색"
            aria-expanded={searchOpen}
            aria-controls={searchOpen ? SEARCH_INPUT_ID : undefined}
            onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
            className={searchOpen ? "text-primary" : undefined}
          >
            <SearchIcon size={22} />
          </IconButton>
          <IconButton
            aria-label={mode === "list" ? "달력으로 보기" : "목록으로 보기"}
            onClick={() => {
              setMode(mode === "list" ? "calendar" : "list");
              // 보기를 바꾸면 배너로 골랐던 대회는 잊는다 — 달력은 늘 가장 가까운 대회 날부터 연다.
              setFocus(null);
            }}
            className="mr-2"
          >
            {mode === "list" ? (
              <CalendarIcon size={22} />
            ) : (
              <ListIcon size={22} />
            )}
          </IconButton>
        </div>
        {searchOpen ? (
          <CompetitionSearchField
            id={SEARCH_INPUT_ID}
            value={filter.nameQuery}
            onChange={setNameQuery}
            onClose={closeSearch}
          />
        ) : null}
      </div>

      <CompetitionClosingSoonBanner
        items={closingSoon}
        onSelect={focusCompetition}
      />

      {mode === "calendar" ? (
        // 달력은 걸러서 비어도 그대로 둔다 — 달을 넘기며 다른 날을 볼 수 있어야 한다.
        // 배너에서 대회를 누르면 key를 바꿔 그 날짜를 고른 채로 다시 그린다.
        <CompetitionCalendar
          key={focus ? `focus-${focus.seq}` : "initial"}
          focusDate={focus?.date}
          months={visibleMonths}
          lastMonth={months.at(-1) ?? { year: currentYear, month: 12 }}
          today={today}
          currentYear={currentYear}
          interest={interest}
          filtered={!isCompetitionFilterEmpty(activeFilter)}
        />
      ) : visibleMonths.length === 0 ? (
        <EmptyState
          title={
            emptyBySearchOnly
              ? "이름이 맞는 대회가 없어요"
              : "조건에 맞는 대회가 없어요"
          }
          action={
            emptyBySearchOnly
              ? { label: "검색어 지우기", onClick: () => setNameQuery("") }
              : {
                  label: "필터 지우기",
                  // 검색칸이 열려 있으면 검색어도 함께 비운다 — EMPTY에 빈 검색어가 들어 있다.
                  onClick: () => setFilter(EMPTY_COMPETITION_FILTER),
                }
          }
          className="pt-[30vh]"
        />
      ) : (
        <div className="pb-6">
          {visibleMonths.map((month) => (
            <MonthSection
              key={`${month.year}-${month.month}`}
              month={month}
              currentYear={currentYear}
              interest={interest}
            />
          ))}
        </div>
      )}

      <CompetitionRegionSheet
        key={regionSheetKey}
        open={regionSheetOpen}
        selected={filter.regions}
        available={regionsWithCompetitions}
        onDismiss={() => setRegionSheetOpen(false)}
        onApply={(regions) => {
          setFilter((current) => ({ ...current, regions }));
          setRegionSheetOpen(false);
        }}
      />
    </>
  );
}

const FILTER_BAR_ID = "competition-filter-bar";
const SEARCH_INPUT_ID = "competition-name-search";
const SEARCH_BUTTON_ID = "competition-name-search-toggle";

/** 안 골랐으면 "지역", 하나면 "서울", 여럿이면 "서울 외 2". */
function regionLabel(regions: readonly CompetitionRegion[]) {
  if (regions.length === 0) return "지역";
  if (regions.length === 1) return regions[0];
  return `${regions[0]} 외 ${regions.length - 1}`;
}
