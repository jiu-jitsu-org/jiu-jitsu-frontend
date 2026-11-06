import type { ReactNode } from "react";

import type {
  CompetitionListItem,
  CompetitionListMonth,
} from "@/features/competition/application/get-competition-list-page-data";
import type {
  Competition,
  CompetitionDivision,
} from "@/features/competition/domain/competition";
import { isPopularCompetition } from "@/features/competition/domain/competition-popularity";
import type { RegistrationStatus } from "@/features/competition/domain/competition-registration";
import type { CompetitionInterest } from "@/features/competition/presentation/use-competition-interest";
import type { CompetitionLook } from "@/features/competition/presentation/competition-look";
import { cn } from "@/shared/lib/cn";
import { HeartIcon } from "@/shared/ui/icons";
import { SURFACE_PRESS } from "@/shared/ui/press-styles";

/**
 * 한 달 묶음 (#332·#348).
 *
 * a·b안: 옅은 면 카드 하나에 달 이름(머리)과 그 달 대회 줄을 함께 담는다 — 축구 일정 앱처럼 묶음을 카드 단위로
 * 끊어 읽게 한다. 주짓수 대회는 하루에 몇 개 안 돼서 날짜가 아니라 달로 묶는다. 줄끼리는 선 대신 간격으로 나눈다.
 * c안: 달 이름은 카드 밖 머리로 두고 대회마다 흰 카드 한 장(회색 바탕 위).
 * 상태가 없어 서버·클라이언트 어디서든 그릴 수 있다(필터 화면이 클라이언트에서 그린다).
 */
export function MonthSection({
  month,
  currentYear,
  interest,
  look = "a",
}: {
  month: CompetitionListMonth;
  currentYear: number;
  /** 넘기면 줄마다 오른쪽에 관심 버튼과 관심 수를 단다(#335). */
  interest?: CompetitionInterest;
  look?: CompetitionLook;
}) {
  const headingId = `competition-month-${month.year}-${month.month}`;
  // 올해는 "11월", 해가 바뀌면 "2027년 1월" — 연말에 다음 해 대회가 섞여도 헷갈리지 않게.
  const label =
    month.year === currentYear
      ? `${month.month}월`
      : `${month.year}년 ${month.month}월`;
  const rows = month.items.map((item) => (
    <CompetitionRow
      key={item.competition.id}
      item={item}
      currentYear={currentYear}
      interest={interest}
      look={look}
    />
  ));

  if (look === "c") {
    return (
      <section aria-labelledby={headingId} className="px-3 pb-2">
        <h2
          id={headingId}
          className="px-1 pt-4 pb-2.5 text-[17px] leading-[24px] font-bold text-text-primary"
        >
          {label}
        </h2>
        <ul className="flex flex-col gap-2.5">{rows}</ul>
      </section>
    );
  }

  return (
    <section
      aria-labelledby={headingId}
      className="mx-3 mt-3 rounded-20 bg-surface-field-subtle px-4 pt-4 pb-1 first:mt-1"
    >
      <h2
        id={headingId}
        className="text-[17px] leading-[24px] font-bold text-text-primary"
      >
        {label}
      </h2>
      <ul className="flex flex-col pt-1">{rows}</ul>
    </section>
  );
}

export function competitionRowId(competitionId: string) {
  return `competition-${competitionId}`;
}

/**
 * 대회 한 줄 (#348). 달력 보기의 그날 대회 목록도 같은 줄(a안)을 쓴다.
 *
 * 왼쪽 날짜·요일(b안은 포스터), 가운데 세 단 — 대회 이름(굵게) → "장소 · 부문 · 대상"(회색) → 상태 칩 줄,
 * 오른쪽 관심(하트). 맛집 목록의 "이름 → 설명 → 별점 줄"처럼 마지막 줄에서 접수 상태를 칩으로 먼저 읽게 한다.
 */
export function CompetitionRow({
  item,
  currentYear,
  interest,
  look = "a",
}: {
  item: CompetitionListItem;
  currentYear: number;
  interest?: CompetitionInterest;
  look?: CompetitionLook;
}) {
  if (look === "c") {
    return (
      <CompetitionTicket
        item={item}
        currentYear={currentYear}
        interest={interest}
      />
    );
  }

  const { competition, registration } = item;
  // 장소·부문이 아직 안 정해진 대회는 둘째 줄을 통째로 뺀다 — 빈 줄이 높이만 차지하지 않게.
  const meta =
    look === "b"
      ? [longDate(competition.date), metaLine(competition)]
          .filter(Boolean)
          .join(" · ")
      : metaLine(competition);
  const popular = isPopular(competition, interest);

  return (
    // id는 마감 배너(#344)에서 누르면 이 줄로 내려오는 데 쓴다. 위에 붙은 필터 줄에 가리지 않게 여백을 둔다.
    <li
      id={competitionRowId(competition.id)}
      tabIndex={-1}
      className={cn(
        "flex scroll-mt-20 gap-3 py-3 outline-none",
        look === "b" ? "items-center" : "items-start",
      )}
    >
      {look === "b" ? (
        <PosterThumb competition={competition} />
      ) : (
        <DateColumn date={competition.date} />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 관심 많은 대회(#336)는 상태 칩 줄이 넘치지 않게 이름 위에 따로 둔다. 몇 명인지는 오른쪽 관심 수가 말한다. */}
        {popular ? (
          <span className="mb-1">
            <StatusChip tone="neutral">관심 많은 대회</StatusChip>
          </span>
        ) : null}
        <h3 className="text-[16px] leading-[24px] font-bold break-keep text-text-primary [overflow-wrap:anywhere]">
          {competition.name}
        </h3>
        {meta ? (
          <p className="text-[14px] leading-[20px] text-text-secondary">
            {meta}
          </p>
        ) : null}
        {registration ? (
          <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <RegistrationChip status={registration} />
            <RegistrationNote status={registration} currentYear={currentYear} />
          </div>
        ) : null}
      </div>
      {interest ? (
        <InterestButton
          competitionName={competition.name}
          interested={interest.isInterested(competition.id)}
          count={interest.countOf(competition.id)}
          onToggle={() => interest.toggle(competition.id)}
          className="self-center"
        />
      ) : null}
    </li>
  );
}

/**
 * c안 — 대회 한 장 카드 (인보이스 목록 참고).
 *
 * 위: 동그란 날짜 배지 · 이름/설명 · 오른쪽 위 하트(금액 자리). 점선 아래: 왼쪽 상태 칩, 오른쪽 남은 날(날짜 자리).
 */
function CompetitionTicket({
  item: { competition, registration },
  currentYear,
  interest,
}: {
  item: CompetitionListItem;
  currentYear: number;
  interest?: CompetitionInterest;
}) {
  const meta = metaLine(competition);
  const popular = isPopular(competition, interest);
  const weekday = weekdayOf(competition.date);

  return (
    <li
      id={competitionRowId(competition.id)}
      tabIndex={-1}
      className="scroll-mt-20 rounded-20 bg-surface-container px-4 pt-4 pb-3.5 outline-none"
    >
      <div className="flex items-start gap-3">
        <time
          dateTime={competition.date}
          className="flex size-11 flex-none flex-col items-center justify-center rounded-full bg-surface-field"
        >
          <span className="text-[16px] leading-[18px] font-bold text-text-primary tabular-nums">
            {Number(competition.date.slice(8, 10))}
          </span>
          <span
            className={cn(
              "text-[10px] leading-[12px] font-medium",
              weekdayTone(weekday.index),
            )}
          >
            {weekday.label}
          </span>
        </time>
        <div className="flex min-w-0 flex-1 flex-col pt-0.5">
          <h3 className="text-[16px] leading-[22px] font-bold break-keep text-text-primary [overflow-wrap:anywhere]">
            {competition.name}
          </h3>
          {meta ? (
            <p className="mt-0.5 text-[14px] leading-[20px] text-text-secondary">
              {meta}
            </p>
          ) : null}
        </div>
        {interest ? (
          <InterestButton
            competitionName={competition.name}
            interested={interest.isInterested(competition.id)}
            count={interest.countOf(competition.id)}
            onToggle={() => interest.toggle(competition.id)}
            className="-mt-1.5 self-start"
          />
        ) : null}
      </div>
      {registration || popular ? (
        <div className="mt-3 ml-14 flex items-center justify-between gap-2 border-t border-dashed border-border-default pt-3">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            {registration ? <RegistrationChip status={registration} /> : null}
            {popular ? (
              <StatusChip tone="neutral">관심 많은 대회</StatusChip>
            ) : null}
          </div>
          {registration ? (
            <RegistrationNote status={registration} currentYear={currentYear} />
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function isPopular(competition: Competition, interest?: CompetitionInterest) {
  return (
    interest !== undefined &&
    isPopularCompetition(interest.countOf(competition.id))
  );
}

/** a안 왼쪽 날짜·요일 칸. */
function DateColumn({ date }: { date: string }) {
  const weekday = weekdayOf(date);
  return (
    <time dateTime={date} className="flex w-8 flex-none flex-col items-center">
      <span className="text-[20px] leading-[24px] font-bold text-text-primary tabular-nums">
        {Number(date.slice(8, 10))}
      </span>
      <span
        className={cn(
          "text-[12px] leading-[16px] font-medium",
          weekdayTone(weekday.index),
        )}
      >
        {weekday.label}
      </span>
    </time>
  );
}

/** 일요일 빨강 · 토요일 파랑 · 평일 회색. */
function weekdayTone(index: number) {
  if (index === 0) return "text-text-error";
  if (index === 6) return "text-primary";
  return "text-text-secondary";
}

const POSTER_TONES = [
  "bg-surface-primary",
  "bg-surface-poll-a-track",
  "bg-surface-poll-b-track",
  "bg-surface-tertiary",
] as const;

/**
 * b안 포스터 썸네일. 포스터 이미지가 아직 없어 대회 이름을 얹은 색 면으로 대신한다(시안).
 * 대회 id로 색을 골라 새로고침해도 같은 색이다.
 */
function PosterThumb({ competition }: { competition: Competition }) {
  const tone =
    POSTER_TONES[
      [...competition.id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) %
        POSTER_TONES.length
    ];
  return (
    <div
      aria-hidden
      className={cn(
        "flex h-[84px] w-16 flex-none items-end overflow-hidden rounded-10 p-1.5",
        tone,
      )}
    >
      <span className="line-clamp-3 text-[10px] leading-[12px] font-bold break-keep text-text-primary [overflow-wrap:anywhere]">
        {competition.name}
      </span>
    </div>
  );
}

/**
 * 상태 칩 — 줄 마지막 단의 작은 알약.
 *
 * 한 줄에 색 면은 접수 중(옅은 파랑) 하나뿐이다. 접수 예정·관심 많은 대회는 회색 면, 마감은 흐린 회색 면.
 * 누르는 칩(필터 줄)과 헷갈리지 않게 테두리 없이 면만 쓰고 높이를 22로 낮춘다.
 */
function StatusChip({
  tone,
  children,
}: {
  tone: "primary" | "neutral" | "disabled";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center rounded-full px-2 text-[12px] leading-none font-semibold whitespace-nowrap",
        tone === "primary" && "bg-surface-primary-subtle text-primary",
        tone === "neutral" && "bg-surface-secondary text-text-secondary-strong",
        tone === "disabled" && "bg-surface-disabled text-text-disabled",
      )}
    >
      {children}
    </span>
  );
}

/**
 * 관심 버튼 (#335·#348) — 하트 아래 익명 관심 수.
 *
 * 커뮤니티 글의 좋아요와 같은 하트·색 토큰을 쓴다: 등록 전 옅은 회색 선, 등록하면 빨강 채움.
 * 관심 수는 아무도 없으면 빼서 "0"이 줄마다 늘어서지 않게 한다. 누가 눌렀는지는 보여 주지 않는다.
 * 대회마다 같은 자리에 온다 — a·b안은 줄 세로 가운데, c안은 카드 오른쪽 위.
 */
function InterestButton({
  competitionName,
  interested,
  count,
  onToggle,
  className,
}: {
  competitionName: string;
  interested: boolean;
  count: number;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={interested}
      aria-label={`${competitionName} 관심 등록${count > 0 ? `, 관심 ${count}명` : ""}`}
      className={cn(
        // 관심 수가 없어도 누를 자리는 44×44를 지킨다.
        "-mr-1.5 flex min-h-11 w-11 flex-none flex-col items-center justify-center gap-0.5 rounded-10 py-1",
        SURFACE_PRESS,
        className,
      )}
    >
      <HeartIcon
        size={22}
        filled={interested}
        className={
          interested
            ? "text-reaction-bar-active-like-icon"
            : "text-reaction-bar-default-icon"
        }
      />
      {count > 0 ? (
        <span
          className={cn(
            "text-[12px] leading-[15px] tabular-nums",
            interested
              ? "text-reaction-bar-active-count-text"
              : "text-reaction-bar-default-count-text",
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

/**
 * 접수 상태 칩 — 접수 중(파랑 면) · 접수 예정(회색 면) · 접수 마감(흐린 면).
 * 남은 날은 칩 옆 글자(RegistrationNote)로 따로 둔다 — c안은 칩과 글자를 카드 양 끝에 나눠 놓는다.
 */
function RegistrationChip({ status }: { status: RegistrationStatus }) {
  switch (status.kind) {
    case "upcoming":
      return <StatusChip tone="neutral">접수 예정</StatusChip>;
    case "closed":
      return <StatusChip tone="disabled">접수 마감</StatusChip>;
    case "open":
      return <StatusChip tone="primary">접수 중</StatusChip>;
  }
}

/**
 * 칩 옆 남은 날 — "마감 D-12" · "11월 10일 오픈". 마감 대회는 없다.
 * 얼리버드 마감이 D-7 안이면 빨강 굵게 강조한다 — 놓치면 참가비가 오르는 유일한 신호라 한 줄에서 이것만 빨강이다.
 */
function RegistrationNote({
  status,
  currentYear,
}: {
  status: RegistrationStatus;
  currentYear: number;
}) {
  switch (status.kind) {
    case "upcoming":
      return (
        <ChipNote>{`${shortDate(status.opensOn, currentYear)} 오픈`}</ChipNote>
      );
    case "closed":
      return null;
    case "open":
      return (
        <ChipNote emphasized={status.deadline === "early-bird"}>
          {deadlineLabel(status)}
        </ChipNote>
      );
  }
}

/** 칩 옆 짧은 글자 — 칩과 같은 높이 가운데에 맞춘다. */
function ChipNote({
  emphasized = false,
  children,
}: {
  emphasized?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "text-[13px] leading-[22px] whitespace-nowrap",
        emphasized ? "font-semibold text-text-error" : "text-text-secondary",
      )}
    >
      {children}
    </span>
  );
}

/** 접수 중 대회의 남은 날 — "얼리버드 마감 D-3" · "마감 D-12". 마감 배너(#344)도 같은 문구를 쓴다. */
export function deadlineLabel(
  status: Extract<RegistrationStatus, { kind: "open" }>,
) {
  return status.deadline === "early-bird"
    ? `얼리버드 ${dDayLabel(status.daysLeft)}`
    : dDayLabel(status.daysLeft);
}

/** 남은 날 → "마감 D-3", 당일은 "오늘 마감". */
function dDayLabel(daysLeft: number) {
  return daysLeft === 0 ? "오늘 마감" : `마감 D-${daysLeft}`;
}

/** "2026-11-10" → 올해면 "11월 10일", 아니면 "2027년 1월 2일". */
function shortDate(date: string, currentYear: number) {
  const [year, month, day] = date.split("-").map(Number);
  return year === currentYear
    ? `${month}월 ${day}일`
    : `${year}년 ${month}월 ${day}일`;
}

/** b안 설명 줄 앞 날짜 — "11월 14일 (토)". */
function longDate(date: string) {
  const [, month, day] = date.split("-").map(Number);
  return `${month}월 ${day}일 (${weekdayOf(date).label})`;
}

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

/** "YYYY-MM-DD" → 요일. 날짜만 있는 값이라 UTC로 계산해 실행 환경 타임존과 무관하게 같다. */
function weekdayOf(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const index = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return { index, label: WEEKDAY_LABELS[index] };
}

const DIVISION_LABELS: Record<CompetitionDivision, string> = {
  gi: "도복",
  nogi: "노기",
};

/** "서울 송파 · 도복 · 노기 · 키즈" — 부문은 도복 → 노기 순, 대상은 제한된 대회만. */
function metaLine(competition: Competition) {
  const divisions = (["gi", "nogi"] as const)
    .filter((division) => competition.divisions.includes(division))
    .map((division) => DIVISION_LABELS[division]);

  return [competition.place.trim(), ...divisions, competition.audience?.trim()]
    .filter(Boolean)
    .join(" · ");
}
