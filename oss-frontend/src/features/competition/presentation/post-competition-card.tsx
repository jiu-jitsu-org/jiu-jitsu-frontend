"use client";

import { useMemo } from "react";

import type { CompetitionCard } from "@/features/competition/domain/competition-card";
import { RegistrationIcon } from "@/features/competition/presentation/competition-icons";
import { CompetitionDetailLink } from "@/features/competition/presentation/competition-detail-link";
import {
  InterestButton,
  metaLine,
  RegistrationChip,
  StatusChip,
} from "@/features/competition/presentation/competition-month-section";
import { useCompetitionInterest } from "@/features/competition/presentation/use-competition-interest";
import { cn } from "@/shared/lib/cn";

/**
 * 커뮤니티 글이 고른 대회 카드 (#379 피드 · #380 글 상세) — 대회 탭 목록 줄의 축소판.
 *
 * 글 안에서는 대회가 주인공이 아니라서 목록 줄(왼쪽 날짜 칸 + 큰 박스)보다 작게 둔다(2026-11-09 B안): 회색 박스 하나에
 * 왼쪽 작은 날짜 타일("11월 / 22") · 가운데 대회 이름과 접수 칩(작은 크기) · 장소 · 부문 · 오른쪽 관심(하트).
 * 목록처럼 달 머리가 없어 날짜 타일에 달을 함께 쓴다. 칩·하트는 목록과 같은 부품이다.
 * 카드를 누르면 글이 아니라 대회 상세로 간다(대회 이름 링크가 카드 전체를 덮는다).
 * 하트는 대회 탭과 같은 관심 등록 — 처음 등록이면 감싼 CompetitionAlertProvider가 마감 알림 시트를 띄운다(#375).
 * 끝난 대회는 접수 상태 자리에 '종료'를 두고 하트는 뺀다. 눌러도 그대로 대회 상세로 간다.
 *
 * 관심 상태는 카드마다 따로 든다 — 피드는 페이지를 이어 붙이며 글이 늘어나, 목록 전체로 들면 다음 페이지가 올 때마다
 * 이 화면에서 누른 값이 지워진다. 같은 대회를 고른 글이 둘이면 서로 따라 바뀌지는 않는다(돌아오면 서버 값으로 맞는다).
 */
export function PostCompetitionCard({
  card,
  className,
}: {
  card: CompetitionCard;
  className?: string;
}) {
  const { competition, registration, ended, currentYear } = card;
  // 훅은 서버 값이 "바뀌었는지"를 참조로 본다 — 매번 새 배열을 넘기면 바뀐 것으로 알고 끝없이 다시 그린다.
  const interestedIds = useMemo(
    () => (card.interested ? [competition.id] : []),
    [card.interested, competition.id],
  );
  const interestCounts = useMemo(
    () => ({ [competition.id]: card.interestCount }),
    [card.interestCount, competition.id],
  );
  const interest = useCompetitionInterest({ interestedIds, interestCounts });
  const interested = interest.isInterested(competition.id);

  const [year, month, day] = competition.date.split("-").map(Number);

  return (
    <div
      className={cn(
        "relative flex items-center gap-3 rounded-2xl bg-surface-field py-2.5 pr-3.5 pl-2.5 transition-colors duration-120 has-[[data-detail-link]:active]:bg-surface-container-pressed",
        className,
      )}
    >
      {/* 날짜 타일 — 해가 다르면 달 자리에 "27.1"처럼 연도를 붙인다(타일 폭 48에 들어가게). */}
      <time
        dateTime={competition.date}
        className="flex size-12 flex-none flex-col items-center justify-center rounded-xl bg-surface-container"
      >
        <span className="text-[11px] leading-[14px] font-medium text-text-secondary tabular-nums">
          {year === currentYear ? `${month}월` : `${year % 100}.${month}`}
        </span>
        <span className="text-[18px] leading-[22px] font-bold text-text-primary tabular-nums">
          {day}
        </span>
      </time>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] leading-[21px] font-bold text-text-primary">
          <CompetitionDetailLink
            competitionId={competition.id}
            className="after:rounded-2xl"
          >
            {competition.name}
          </CompetitionDetailLink>
        </p>
        <div className="mt-1 flex min-w-0 items-center gap-1.5">
          {ended ? (
            <StatusChip
              size="s"
              tone="disabled"
              icon={<RegistrationIcon stage="closed" size={14} />}
            >
              종료
            </StatusChip>
          ) : registration ? (
            <RegistrationChip
              size="s"
              status={registration}
              // 남은 날은 관심 대회에만 — 목록 줄과 같은 규칙.
              dday={interested}
              currentYear={currentYear}
            />
          ) : null}
          <span className="min-w-0 truncate text-[13px] leading-[18px] text-text-secondary">
            {metaLine(competition)}
          </span>
        </div>
      </div>
      {ended ? null : (
        <InterestButton
          competitionName={competition.name}
          interested={interested}
          count={interest.countOf(competition.id)}
          onToggle={() => interest.toggle(competition)}
        />
      )}
    </div>
  );
}
