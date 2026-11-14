"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import type { CompetitionDetailStatus } from "@/features/competition/domain/competition-schedule";
import type { CompetitionAlertTarget } from "@/features/competition/presentation/competition-alert-sheet";
import { RegistrationIcon } from "@/features/competition/presentation/competition-icons";
import { shortDateLabel } from "@/features/competition/presentation/competition-detail-format";
import { recordCompetitionViewAction } from "@/features/competition/presentation/actions/record-competition-view-action";
import { useCompetitionDetailInterest } from "@/features/competition/presentation/competition-detail-interest";
import { cn } from "@/shared/lib/cn";
import { HeartIcon } from "@/shared/ui/icons";
import { Button } from "@/shared/ui/button";

/**
 * 대회 상세 맨 위 (#361 · #362) — 접수 상태와 가장 가까운 마감 → 대회 이름 → 조회수 · 관심 등록.
 *
 * 관심 등록은 이 화면의 주 행동이라 하트만 있는 목록과 달리 "관심 32"처럼 글자를 단 버튼으로 둔다.
 * 등록·해제·첫 등록 알림 시트·실패 되돌리기는 목록과 같은 훅을 쓴다(#335 · #375). 관심 상태는 머리의 알림 종과 함께 본다(#376).
 * 끝난 대회는 마감 알림을 받을 일이 없어 버튼 대신 관심 수만 글자로 남긴다.
 * 아래 상태 버튼 바가 있으면 관심 버튼은 바 왼쪽 하트로 옮겨 가고(같은 동작을 두 곳에 두지 않는다), 여기엔 관심 수만 글자로 남긴다.
 * 조회수는 화면이 열린 뒤 한 번 세고(#420) 센 값으로 바꾼다 — 서버 렌더는 로그인 뒤 다시 그리기에서도 돌아 세지 않는다.
 */
export function CompetitionDetailSummary({
  target,
  status,
  currentYear,
  viewCount,
  interestInBar,
}: {
  target: CompetitionAlertTarget;
  status: CompetitionDetailStatus | null;
  currentYear: number;
  viewCount: number;
  /** 관심 버튼이 아래 바에 있는지 — 그러면 여기엔 관심 수만 글자로 둔다. */
  interestInBar: boolean;
}) {
  const { id: competitionId, name } = target;
  const [views, setViews] = useState(viewCount);
  const counted = useRef(false);
  useEffect(() => {
    if (counted.current) return;
    counted.current = true;
    void recordCompetitionViewAction(competitionId)
      .then((next) => {
        if (next !== null) setViews(next);
      })
      .catch(() => undefined);
  }, [competitionId]);
  const interest = useCompetitionDetailInterest();
  const count = interest.countOf(competitionId);
  const ended = status?.kind === "ended";
  const buttonHere = !ended && !interestInBar;

  return (
    <section className="px-4 pt-4">
      {status ? <StatusLine status={status} currentYear={currentYear} /> : null}
      <h1
        className={cn(
          status && "mt-2",
          "text-[24px] leading-[32px] font-bold break-keep text-text-primary [overflow-wrap:anywhere]",
        )}
      >
        {name}
      </h1>
      <div className="mt-3 flex min-h-8 items-center gap-2">
        <p className="flex-1 text-[13px] leading-[18px] text-text-tertiary tabular-nums">
          {[
            `조회 ${views.toLocaleString("ko-KR")}`,
            !buttonHere && count > 0 ? `관심 ${count}` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {buttonHere ? (
          <CompetitionDetailInterestButton target={target} shape="pill" />
        ) : null}
      </div>
    </section>
  );
}

/**
 * 관심 등록 버튼 — 요약 줄의 "♡ 관심 32" 알약(pill), 또는 아래 상태 버튼 바 왼쪽의 하트만 든 정사각(icon).
 * 정사각은 옆 버튼(Button l)과 같은 51 높이 · 보조(neutral) 면이고, 관심 수는 요약 줄 글자가 맡는다.
 * 등록 · 해제 · 비로그인 · 첫 등록 알림은 같은 훅(useCompetitionDetailInterest)이 한다.
 */
export function CompetitionDetailInterestButton({
  target,
  shape,
}: {
  target: CompetitionAlertTarget;
  shape: "pill" | "icon";
}) {
  const interest = useCompetitionDetailInterest();
  const on = interest.isInterested(target.id);
  const count = interest.countOf(target.id);
  const heart = (
    <HeartIcon
      size={shape === "icon" ? 24 : 18}
      filled={on}
      className={
        on
          ? "text-reaction-bar-active-like-icon"
          : "text-reaction-bar-default-icon"
      }
    />
  );
  const props = {
    onClick: () => interest.toggle(target),
    "aria-pressed": on,
    "aria-label": `관심 등록${count > 0 ? `, 관심 ${count}명` : ""}`,
  };
  if (shape === "icon") {
    return (
      <Button variant="neutral" size="l" className="w-[51px]" {...props}>
        {heart}
      </Button>
    );
  }
  return (
    <Button
      variant="neutral"
      size="s"
      {...props}
      // 누르기 전은 아래 정보 상자와 같은 옅은 회색 면 — 기본 회색 버튼 면은 이 자리에서 너무 짙어 보였다.
      className={cn(
        "gap-1 rounded-full pr-3.5 pl-3",
        !on && "bg-surface-field",
      )}
    >
      {heart}
      <span className="tabular-nums">관심{count > 0 ? ` ${count}` : ""}</span>
    </Button>
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
            <Chip
              tone="neutral"
              icon={<RegistrationIcon stage="before" size={16} />}
            >
              접수 예정
            </Chip>
          }
        >
          {shortDateLabel(status.opensOn, currentYear)} 접수 시작
        </Line>
      );
    case "open": {
      const what =
        status.deadline === "early-bird" ? "얼리버드 마감" : "접수 마감";
      return (
        <Line
          chip={
            <Chip
              tone="primary"
              icon={<RegistrationIcon stage="open" size={16} />}
            >
              접수 중
            </Chip>
          }
          urgent={status.urgent}
        >
          {status.daysLeft === 0
            ? `오늘 ${what}`
            : `${what} D-${status.daysLeft}`}
        </Line>
      );
    }
    case "closed":
      return (
        <Line
          chip={
            <Chip
              tone="disabled"
              icon={<RegistrationIcon stage="closed" size={16} />}
            >
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
            <Chip
              tone="primary"
              icon={<RegistrationIcon stage="closed" size={16} />}
            >
              오늘 대회
            </Chip>
          }
        />
      );
    case "ended":
      return (
        <Line
          chip={
            <Chip
              tone="disabled"
              icon={<RegistrationIcon stage="closed" size={16} />}
            >
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
