"use client";

import { useMemo, type ReactNode } from "react";

import type { CompetitionDetailStatus } from "@/features/competition/domain/competition-schedule";
import { RegistrationIcon } from "@/features/competition/presentation/competition-icons";
import { shortDateLabel } from "@/features/competition/presentation/competition-detail-format";
import { useCompetitionInterest } from "@/features/competition/presentation/use-competition-interest";
import { cn } from "@/shared/lib/cn";
import { HeartIcon } from "@/shared/ui/icons";
import { Button } from "@/shared/ui/button";

/**
 * 대회 상세 맨 위 (#361 · #362) — 접수 상태와 가장 가까운 마감 → 대회 이름 → 조회수 · 관심 등록.
 *
 * 관심 등록은 이 화면의 주 행동이라 하트만 있는 목록과 달리 "관심 32"처럼 글자를 단 버튼으로 둔다.
 * 등록·해제·첫 등록 안내·실패 되돌리기는 목록과 같은 훅을 쓴다(#335).
 * 끝난 대회는 마감 알림을 받을 일이 없어 버튼 대신 관심 수만 글자로 남긴다.
 */
export function CompetitionDetailSummary({
  competitionId,
  name,
  status,
  currentYear,
  interested,
  interestCount,
  viewCount,
}: {
  competitionId: string;
  name: string;
  status: CompetitionDetailStatus | null;
  currentYear: number;
  interested: boolean;
  interestCount: number;
  viewCount: number | null;
}) {
  // 훅은 서버 값이 "바뀌었는지"를 참조로 본다 — 매번 새 배열을 넘기면 바뀐 것으로 알고 끝없이 다시 그린다.
  const interestedIds = useMemo(
    () => (interested ? [competitionId] : []),
    [competitionId, interested],
  );
  const interestCounts = useMemo(
    () => ({ [competitionId]: interestCount }),
    [competitionId, interestCount],
  );
  const interest = useCompetitionInterest({ interestedIds, interestCounts });
  const on = interest.isInterested(competitionId);
  const count = interest.countOf(competitionId);
  const ended = status?.kind === "ended";

  return (
    <section className="px-4 pt-4">
      {status ? <StatusLine status={status} currentYear={currentYear} /> : null}
      <h1 className={cn(status && "mt-2", "text-[22px] leading-[30px] font-bold break-keep text-text-primary [overflow-wrap:anywhere]")}>
        {name}
      </h1>
      <div className="mt-3 flex min-h-8 items-center gap-2">
        <p className="flex-1 text-[13px] leading-[18px] text-text-tertiary tabular-nums">
          {[
            ended && count > 0 ? `관심 ${count}` : null,
            viewCount !== null ? `조회 ${viewCount.toLocaleString("ko-KR")}` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {ended ? null : (
          <Button
            variant="neutral"
            size="s"
            onClick={() => interest.toggle(competitionId)}
            aria-pressed={on}
            aria-label={`관심 등록${count > 0 ? `, 관심 ${count}명` : ""}`}
            className="gap-1 rounded-full pr-3.5 pl-3"
          >
            <HeartIcon
              size={18}
              filled={on}
              className={
                on
                  ? "text-reaction-bar-active-like-icon"
                  : "text-reaction-bar-default-icon"
              }
            />
            <span className="tabular-nums">
              관심{count > 0 ? ` ${count}` : ""}
            </span>
          </Button>
        )}
      </div>
    </section>
  );
}

/**
 * 상태 칩 + 가장 가까운 마감. 칩 모양은 목록 칩과 같은 알약(아이콘 16 · 높이 26 · 글자 13)이되,
 * 흰 바탕 위라 접수 예정·마감·종료는 흰 면 대신 회색 면을 쓴다.
 */
function StatusLine({
  status,
  currentYear,
}: {
  status: CompetitionDetailStatus;
  currentYear: number;
}) {
  switch (status.kind) {
    case "unannounced":
      return (
        <p className="flex h-[26px] items-center text-[13px] font-semibold text-text-secondary">
          접수 일정 미정 · 대회 {dday(status.daysToCompetition)}
        </p>
      );
    case "upcoming":
      return (
        <Line
          chip={
            <Chip tone="neutral" icon={<RegistrationIcon stage="before" size={16} />}>
              접수 예정
            </Chip>
          }
        >
          {shortDateLabel(status.opensOn, currentYear)} 접수 시작
        </Line>
      );
    case "open": {
      const what = status.deadline === "early-bird" ? "얼리버드 마감" : "접수 마감";
      return (
        <Line
          chip={
            <Chip tone="primary" icon={<RegistrationIcon stage="open" size={16} />}>
              접수 중
            </Chip>
          }
          urgent={status.urgent}
        >
          {status.daysLeft === 0 ? `오늘 ${what}` : `${what} D-${status.daysLeft}`}
        </Line>
      );
    }
    case "closed":
      return (
        <Line
          chip={
            <Chip tone="disabled" icon={<RegistrationIcon stage="closed" size={16} />}>
              접수 마감
            </Chip>
          }
        >
          대회 {dday(status.daysToCompetition)}
        </Line>
      );
    case "today":
      return (
        <Line
          chip={
            <Chip tone="primary" icon={<RegistrationIcon stage="closed" size={16} />}>
              오늘 대회
            </Chip>
          }
        />
      );
    case "ended":
      return (
        <Line
          chip={
            <Chip tone="disabled" icon={<RegistrationIcon stage="closed" size={16} />}>
              종료
            </Chip>
          }
        />
      );
  }
}

function dday(days: number) {
  return days === 0 ? "오늘" : `D-${days}`;
}

function Line({
  chip,
  urgent = false,
  children,
}: {
  chip: ReactNode;
  urgent?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      {chip}
      {children ? (
        <span
          className={cn(
            "text-[13px] leading-[18px] font-bold tabular-nums",
            urgent ? "text-text-error" : "text-text-secondary-strong",
          )}
        >
          {children}
        </span>
      ) : null}
    </div>
  );
}

function Chip({
  tone,
  icon,
  children,
}: {
  tone: "primary" | "neutral" | "disabled";
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[26px] items-center gap-1 rounded-full pr-2.5 pl-1.5 text-[13px] leading-none font-semibold whitespace-nowrap",
        tone === "primary" && "bg-surface-primary-subtle text-primary",
        tone === "neutral" && "bg-surface-field text-text-secondary-strong",
        tone === "disabled" && "bg-surface-field text-text-disabled",
      )}
    >
      {icon}
      {children}
    </span>
  );
}
