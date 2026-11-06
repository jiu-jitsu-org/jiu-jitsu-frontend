"use client";

import { useMemo, useState } from "react";

import { useIsSignedIn } from "@/features/auth/presentation/auth-provider";
import { useLoginGuard } from "@/features/community/presentation/use-login-guard";
import type { CompetitionListMonth } from "@/features/competition/application/get-competition-list-page-data";
import {
  EMPTY_COMPETITION_FILTER,
  isCompetitionFilterEmpty,
  matchesCompetitionFilter,
  type CompetitionFilter,
} from "@/features/competition/domain/competition-filter";
import type { CompetitionRegion } from "@/features/competition/domain/competition-region";
import { MonthSection } from "@/features/competition/presentation/competition-month-section";
import { CompetitionRegionSheet } from "@/features/competition/presentation/competition-region-sheet";
import { useCompetitionInterest } from "@/features/competition/presentation/use-competition-interest";
import { ChevronDownIcon } from "@/shared/ui";
import { Chip } from "@/shared/ui/chip";
import { EmptyState } from "@/shared/ui/empty-state";

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
  interestedIds,
  interestCounts,
  regionsWithCompetitions,
}: {
  months: CompetitionListMonth[];
  currentYear: number;
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

  const toggle = (key: "interestedOnly" | "openOnly" | "nogiOnly") =>
    setFilter((current) => ({ ...current, [key]: !current[key] }));

  const toggleInterested = () => toggle("interestedOnly");

  return (
    <>
      {/* 필터 줄: 좌우 16 · 칩 간격 8, 넘치면 가로 스크롤(스크롤바 숨김) — 글쓰기 카테고리 칩 줄과 같은 규격.
          목록 바탕과 같은 면이라 붙어 있어도 선이 따로 필요 없다. */}
      <div className="sticky top-0 z-10 flex gap-2 overflow-x-auto bg-surface-container px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Chip
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
          selected={filter.openOnly}
          aria-pressed={filter.openOnly}
          onClick={() => toggle("openOnly")}
        >
          접수 중
        </Chip>
        <Chip
          selected={filter.nogiOnly}
          aria-pressed={filter.nogiOnly}
          onClick={() => toggle("nogiOnly")}
        >
          노기
        </Chip>
      </div>

      {visibleMonths.length === 0 ? (
        <EmptyState
          title="조건에 맞는 대회가 없어요"
          action={{
            label: "필터 지우기",
            onClick: () => setFilter(EMPTY_COMPETITION_FILTER),
          }}
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

/** 안 골랐으면 "지역", 하나면 "서울", 여럿이면 "서울 외 2". */
function regionLabel(regions: readonly CompetitionRegion[]) {
  if (regions.length === 0) return "지역";
  if (regions.length === 1) return regions[0];
  return `${regions[0]} 외 ${regions.length - 1}`;
}
