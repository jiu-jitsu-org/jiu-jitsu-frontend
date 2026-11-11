"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { useIsSignedIn } from "@/features/auth/presentation/auth-provider";
import { useLoginGuard } from "@/features/community/presentation/use-login-guard";
import type { BeltRank } from "@/features/community/domain/belt";
import type { CompetitionListMonth } from "@/features/competition/application/get-competition-list-page-data";
import {
  EMPTY_COMPETITION_FILTER,
  hasNameQuery,
  isCompetitionFilterEmpty,
  matchesCompetitionFilter,
  type CompetitionFilter,
} from "@/features/competition/domain/competition-filter";
import { deadlineSoonInterested } from "@/features/competition/domain/competition-interest-banner";
import type { CompetitionRegion } from "@/features/competition/domain/competition-region";
import { CompetitionCalendar } from "@/features/competition/presentation/competition-calendar";
import {
  CompetitionInterestBanner,
  InterestBannerTint,
  useCompetitionHeaderTint,
  useDeadlineBannerItem,
} from "@/features/competition/presentation/competition-interest-banner";
import { RegistrationIcon } from "@/features/competition/presentation/competition-icons";
import {
  MonthSection,
  monthLabel,
} from "@/features/competition/presentation/competition-month-section";
import { CompetitionRegionSheet } from "@/features/competition/presentation/competition-region-sheet";
import { CompetitionSearchField } from "@/features/competition/presentation/competition-search-field";
import {
  useOpenCompetitionDetail,
  useRefreshAfterDetail,
} from "@/features/competition/presentation/competition-detail-link";
import { useCompetitionInterest } from "@/features/competition/presentation/use-competition-interest";
import { useMyBeltRank } from "@/features/competition/presentation/use-my-belt-rank";
import { cn } from "@/shared/lib/cn";
import {
  CalendarIcon,
  ChevronDownIcon,
  HeartIcon,
  ListIcon,
  SearchIcon,
} from "@/shared/ui";
import { Chip } from "@/shared/ui/chip";
import { EmptyState } from "@/shared/ui/empty-state";
import { IconButton } from "@/shared/ui/icon-button";

/**
 * 대회 목록 + 위 필터 줄 (#334·#396) — 지금 달 · 지역 · 접수 중 (+ 관심 하트 · 목록/달력).
 *
 * 목록은 서버가 한 번에 다 보내고 거르기는 여기서 한다 — 대회 수가 한 해 수백 건이라 칩을 누를 때마다
 * 서버를 다시 부르지 않는다. 필터 줄은 목록을 내려도 위에 붙어 있어 언제든 바꿀 수 있다.
 * 걸러서 대회가 하나도 없는 달은 달 이름까지 뺀다.
 * 관심 하트와 목록 ↔ 달력은 화면 전체에 걸리는 동작이라 앱 '대회' 머리에 둔다(#396). 앱이 그 버튼을 모르면
 * (구버전 앱·브라우저) 필터 줄 오른쪽 끝에 같은 버튼을 그린다.
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
  myBeltRank,
}: {
  months: CompetitionListMonth[];
  currentYear: number;
  /** 한국 날짜 "YYYY-MM-DD" — 달력 보기용. */
  today: string;
  interestedIds: string[];
  interestCounts: Record<string, number>;
  regionsWithCompetitions: CompetitionRegion[];
  /** 내 띠 — 관심 대회 머리 캐릭터·위 그라데이션 색. 없으면 흰띠. */
  myBeltRank: BeltRank | null;
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
  // 필터 줄(칩 + 열린 검색칸)과 목록 — 스크롤하며 어느 달 머리가 필터 줄 밑으로 지나갔는지 잰다.
  // 지나간 마지막 달이 필터 줄 왼쪽의 '지금 달'이다. 아무 달도 안 지났으면(맨 위) 첫 달.
  const filterBarRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [passedMonthIndex, setPassedMonthIndex] = useState<number | null>(null);

  const signedIn = useIsSignedIn();
  // 서버가 띠를 못 받아 흰띠로 그렸어도 화면에서 다시 읽어 내 띠로 바로잡는다(#388).
  const beltRank = useMyBeltRank(myBeltRank, signedIn);
  const { guard } = useLoginGuard();
  const interest = useCompetitionInterest({ interestedIds, interestCounts });
  // 상세에서 관심을 바꾸고 돌아오면 그 값으로 다시 그린다(#362).
  useRefreshAfterDetail();

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

  // 달 머리가 필터 줄 밑으로 지나가면 필터 줄 왼쪽의 달 이름을 그 달로 바꾼다(#396).
  // 전에는 지나간 달 머리를 필터 줄 아래에 한 줄 더 이어 달았는데, 위에 붙는 줄이 둘이 되어 한 줄로 합쳤다.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      // 검색칸을 여닫으며 목록이 미끄러지는 동안은 옮겨 둔 자리라 재지 않는다 — 끝나면 다시 잰다.
      if (belowBarRef.current?.getAnimations().length) return;
      const barBottom = filterBarRef.current?.offsetHeight ?? 0;
      // 목록 속 달 글자가 필터 줄 아래 끝에 닿는 순간 바꾼다 — 그 달 머리가 줄 밑으로 들어가며 이름을 넘겨준다.
      const labels = Array.from(
        list.querySelectorAll("section > h2 [data-month-label]"),
      );
      let passed: number | null = null;
      for (const [index, label] of labels.entries()) {
        if (label.getBoundingClientRect().top <= barBottom + 0.5)
          passed = index;
      }
      setPassedMonthIndex(passed);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [mode, visibleMonths, searchOpen]);
  // 달력은 제 머리에 달을 크게 보여 주므로 필터 줄의 달 이름은 목록에서만 둔다.
  const currentMonth =
    mode === "list" ? visibleMonths[passedMonthIndex ?? 0] : undefined;

  // 검색칸이 열리고 닫히면 필터 줄 높이가 바뀌어 그 아래(배너·목록)가 한 번에 밀린다.
  // 밀린 만큼 거꾸로 옮겨 놓고 제자리로 미끄러지게 해, 검색칸이 나타나는 0.5초 동안 함께 움직이게 한다.
  // 높이는 움직이지 않고 위치(transform)만 움직이며, 끝나면 아무것도 남기지 않는다.
  const belowBarRef = useRef<HTMLDivElement>(null);
  const lastBarHeight = useRef<number | null>(null);
  useLayoutEffect(() => {
    const height = filterBarRef.current?.offsetHeight ?? 0;
    const shift = (lastBarHeight.current ?? height) - height;
    lastBarHeight.current = height;
    if (shift === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const easing =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--ease-smooth-out")
        .trim() || "cubic-bezier(0.2, 0.8, 0.2, 1)";
    const element = belowBarRef.current;
    if (element) {
      // 미끄러지는 도중에 다시 여닫으면 지금 보이는 자리에서 이어 간다(처음 자리로 튀지 않게).
      const current = new DOMMatrixReadOnly(getComputedStyle(element).transform)
        .m42;
      for (const running of element.getAnimations()) running.cancel();
      const animation = element.animate(
        [
          { transform: `translateY(${shift + current}px)` },
          { transform: "none" },
        ],
        { duration: 500, easing },
      );
      // 움직이는 동안 잰 달 머리 위치는 옮겨 둔 자리라, 끝나면 다시 잰다.
      animation.onfinish = () => window.dispatchEvent(new Event("scroll"));
    }
  }, [searchOpen]);

  // 곧 마감 배너(#396) — 필터와 무관하게 내 관심 대회 전체에서 접수 마감이 일주일 안인 대회를 고른다.
  // 비로그인이면 관심이 없어 비어 있다. 이 기기에서 ✕로 닫은 대회는 건너뛰고 가장 급한 한 장만 띄운다.
  const deadlineSoon = useMemo(
    () =>
      signedIn
        ? deadlineSoonInterested(
            months.flatMap((month) => month.items),
            interest.interestedIds,
            today,
          )
        : [],
    [interest.interestedIds, months, signedIn, today],
  );
  const deadlineBannerItem = useDeadlineBannerItem(deadlineSoon);
  // 달력에서는 배너를 걷는다 — 달력 칸이 첫 화면에 다 들어와야 날짜를 고를 수 있다.
  const showBanner = mode === "list" && deadlineBannerItem !== null;
  // 앱의 '대회' 머리를 맨 위 띠 색 그라데이션과 같은 색으로 — 배너가 보일 때만, 아니면 앱 기본색.
  useCompetitionHeaderTint(showBanner ? (beltRank ?? "white") : null);

  // 배너에서 누른 대회는 상세로 바로 연다(#361) — 목록 줄을 누른 것과 같다.
  const openDetail = useOpenCompetitionDetail();

  const toggle = (key: "interestedOnly" | "openOnly") =>
    setFilter((current) => ({ ...current, [key]: !current[key] }));

  const toggleInterested = () => toggle("interestedOnly");
  // 비로그인이 누르면 필터는 켜지 않고 로그인 안내만 — 켜 봐야 늘 빈 결과다.
  const pressInterested = signedIn
    ? toggleInterested
    : guard(toggleInterested, "관심 대회는 OSS 앱에서 로그인 후 볼 수 있어요.");
  const toggleMode = () =>
    setMode((current) => (current === "list" ? "calendar" : "list"));

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
      {showBanner ? <InterestBannerTint rank={beltRank ?? "white"} /> : null}
      {/* 필터 줄: 좌우 16 · 칩 간격 8, 넘치면 가로 스크롤(스크롤바 숨김) — 글쓰기 카테고리 칩 줄과 같은 규격.
          목록 바탕색을 반투명(60%)으로 깔고 뒤를 흐려, 아래로 지나가는 카드가 비치되 글자는 읽히게 한다.
          흐림 판은 아래 끝을 서서히 지워 선 없이 목록으로 녹아들게 한다.
          왼쪽 끝에 지금 달(#396), 앱이 머리 버튼을 모르면 오른쪽 끝에 관심 하트 · 목록 ↔ 달력(#339)을 고정해 둔다 —
          칩이 늘어 가로로 밀어도 늘 같은 자리에 있게. */}
      <div className="sticky top-0 z-10 [overflow-anchor:none]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -bottom-4 bg-surface-container/60 backdrop-blur-lg [mask-image:linear-gradient(to_bottom,black_calc(100%-28px),transparent)]"
        />
        <div id={FILTER_BAR_ID} ref={filterBarRef} className="relative">
          <div className="flex items-center">
            {currentMonth ? (
              // 목록 속 달 머리(h2)가 뜻을 맡으니 여기는 보이기만 한다. 달 머리 글자와 같은 모양.
              <span
                aria-hidden
                className="flex-none pl-4 text-[13px] leading-[18px] font-semibold whitespace-nowrap text-text-secondary tabular-nums"
              >
                {monthLabel(currentMonth, currentYear)}
              </span>
            ) : null}
            <div
              className={cn(
                "flex min-w-0 flex-1 gap-2 overflow-x-auto py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                currentMonth ? "pl-3" : "pl-4",
                "pr-2",
              )}
            >
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
            </div>
            {COMPETITION_SEARCH_ENABLED ? (
              <IconButton
                id={SEARCH_BUTTON_ID}
                aria-label="대회 이름 검색"
                aria-expanded={searchOpen}
                aria-controls={searchOpen ? SEARCH_INPUT_ID : undefined}
                onClick={() =>
                  searchOpen ? closeSearch() : setSearchOpen(true)
                }
                className={searchOpen ? "text-primary" : undefined}
              >
                <SearchIcon size={22} />
              </IconButton>
            ) : null}
            {/* 하트(관심만 보기)와 목록 ↔ 달력은 칩처럼 바로 아래 목록을 바꾸는 도구라 같은 줄 오른쪽 끝에 둔다.
                앱 머리줄의 알림함은 다른 화면으로 가는 입구라 그쪽에 따로 남긴다. */}
            {/* 관심은 대회 줄의 관심 버튼과 같은 하트·같은 빨강이라 무엇을 거르는지 바로 읽힌다. */}
            <IconButton
              aria-label="관심 대회만 보기"
              aria-pressed={activeFilter.interestedOnly}
              onClick={pressInterested}
            >
              <HeartIcon
                size={22}
                filled={activeFilter.interestedOnly}
                className={
                  activeFilter.interestedOnly
                    ? "text-reaction-bar-active-like-icon"
                    : undefined
                }
              />
            </IconButton>
            <IconButton
              aria-label={mode === "list" ? "달력으로 보기" : "목록으로 보기"}
              onClick={toggleMode}
              className="mr-2"
            >
              {mode === "list" ? (
                <CalendarIcon size={22} />
              ) : (
                <ListIcon size={22} />
              )}
            </IconButton>
          </div>
          {COMPETITION_SEARCH_ENABLED && searchOpen ? (
            <CompetitionSearchField
              id={SEARCH_INPUT_ID}
              value={filter.nameQuery}
              onChange={setNameQuery}
              onClose={closeSearch}
            />
          ) : null}
        </div>
      </div>

      {/* 브라우저가 스크롤을 몰래 고쳐 목록을 제자리에 붙잡으면(크롬) 위 미끄러짐과 어긋나, 여기서는 끈다 —
          사파리처럼 늘 검색칸만큼 밀리고 그 밀림을 미끄러지게 보여 준다. */}
      <div ref={belowBarRef} className="[overflow-anchor:none]">
        <CompetitionInterestBanner
          item={showBanner ? deadlineBannerItem : null}
          currentYear={currentYear}
          beltRank={beltRank}
          onSelect={({ competition }) => openDetail(competition.id)}
        />

        {mode === "calendar" ? (
          // 달력은 걸러서 비어도 그대로 둔다 — 달을 넘기며 다른 날을 볼 수 있어야 한다.
          <CompetitionCalendar
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
          <div ref={listRef} className="pb-6">
            {visibleMonths.map((month, index) => (
              <MonthSection
                key={`${month.year}-${month.month}`}
                month={month}
                currentYear={currentYear}
                interest={interest}
                // 첫 달은 필터 줄 왼쪽에 늘 떠 있어 목록 속 머리는 감춘다 — 같은 달이 두 번 보이지 않게.
                hideHeading={index === 0}
              />
            ))}
          </div>
        )}
      </div>

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
// 이름 검색(#345)은 당분간 숨긴다(#387) — 검색 로직은 그대로 두고 돋보기·검색칸만 감춘다. 다시 켤 때 true.
const COMPETITION_SEARCH_ENABLED = false;
const SEARCH_INPUT_ID = "competition-name-search";
const SEARCH_BUTTON_ID = "competition-name-search-toggle";

/** 안 골랐으면 "지역", 하나면 "서울", 여럿이면 "서울 외 2". */
function regionLabel(regions: readonly CompetitionRegion[]) {
  if (regions.length === 0) return "지역";
  if (regions.length === 1) return regions[0];
  return `${regions[0]} 외 ${regions.length - 1}`;
}
