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
import {
  FlameIcon,
  RegistrationIcon,
} from "@/features/competition/presentation/competition-icons";
import type { CompetitionInterest } from "@/features/competition/presentation/use-competition-interest";
import { cn } from "@/shared/lib/cn";
import { HeartIcon } from "@/shared/ui/icons";
import { SURFACE_PRESS } from "@/shared/ui/press-styles";

/** 달 머리 한 줄의 틀. 달 사이는 위 16으로 띄우고, 맨 첫 달은 필터 줄에 붙어 있어 위 4만 둔다(칩 줄과 16 간격). */
const MONTH_HEADING_CLASS =
  "relative flex items-center gap-2 pt-4 pb-3 [section:first-child>&]:pt-1";

/** 올해는 "11월", 해가 바뀌면 "2027년 1월" — 연말에 다음 해 대회가 섞여도 헷갈리지 않게. */
export function monthLabel(
  month: { year: number; month: number },
  currentYear: number,
) {
  return month.year === currentYear
    ? `${month.month}월`
    : `${month.year}년 ${month.month}월`;
}

/** 달 머리 속 — 줄 위 작은 점 + "12월". `onLine`이면 점 둘레를 바탕색으로 둘러 지나가는 세로 줄을 끊어 보이게 한다. */
export function MonthHeadingContent({
  label,
  onLine = true,
}: {
  label: string;
  onLine?: boolean;
}) {
  return (
    <>
      <span aria-hidden className="flex w-9 flex-none justify-center">
        <span
          className={cn(
            "size-1.5 rounded-full bg-icon-disabled",
            onLine && "ring-4 ring-surface-container",
          )}
        />
      </span>
      <span
        data-month-label
        className="text-[13px] leading-[18px] font-semibold text-text-secondary"
      >
        {label}
      </span>
    </>
  );
}

/**
 * 한 달 묶음 — 세로 타임라인 (#348, 캐롯 주행 기록 참고).
 *
 * 왼쪽 세로 줄 위에 날짜·요일(면 없이 흰 바탕), 오른쪽에 대회마다 회색 박스. 달이 바뀌는 자리는 줄 위 작은 점 + "12월".
 * 줄은 날짜 칸 가운데(36 칸의 18)를 지나 흰 날짜 칸 뒤로 숨는다 — 박스를 넓히려 날짜 칸·틈을 좁게 둔다.
 * 줄은 흐름만 알려 주는 보조 표시라 칩·글자보다 연한 회색 1px로 둔다.
 * 상태가 없어 서버·클라이언트 어디서든 그릴 수 있다(필터 화면이 클라이언트에서 그린다).
 */
export function MonthSection({
  month,
  currentYear,
  interest,
}: {
  month: CompetitionListMonth;
  currentYear: number;
  /** 넘기면 대회마다 칩 줄 끝에 관심(하트)과 관심 수를 단다(#335). */
  interest?: CompetitionInterest;
}) {
  const headingId = `competition-month-${month.year}-${month.month}`;

  return (
    <section aria-labelledby={headingId} className="relative px-4">
      {/* 세로 줄 — 섹션 위아래 끝까지 이어 달이 바뀌어도 끊기지 않는다. */}
      <span
        aria-hidden
        className="absolute top-0 bottom-0 left-[33.5px] w-px bg-surface-secondary"
      />
      {/* 스크롤해 이 머리가 위로 지나가면 필터 줄의 흐림 판이 같은 자리에 같은 모양으로 이어 보여 준다(목록 화면). */}
      <h2 id={headingId} className={MONTH_HEADING_CLASS}>
        <MonthHeadingContent label={monthLabel(month, currentYear)} />
      </h2>
      <ul className="relative flex flex-col gap-3 pb-3">
        {month.items.map((item) => (
          <CompetitionRow
            key={item.competition.id}
            item={item}
            currentYear={currentYear}
            interest={interest}
          />
        ))}
      </ul>
    </section>
  );
}

export function competitionRowId(competitionId: string) {
  return `competition-${competitionId}`;
}

/**
 * 대회 한 줄 (#348). 달력 보기의 그날 대회 목록도 같은 줄을 쓴다.
 *
 * 왼쪽 날짜·요일, 오른쪽 회색 박스 — 대회 이름(굵게) → "장소 · 부문 · 대상"(회색) → 상태 칩 · 관심(하트).
 * 남은 날(D-day)은 내가 관심 등록한 대회에만 접수 칩 안에 작게 붙인다(2026-11) — 모든 대회에 큰 숫자를 두면
 * 이름 자리를 빼앗는데, 챙겨 볼 날짜는 관심 대회뿐이다.
 */
export function CompetitionRow({
  item: { competition, registration },
  currentYear,
  interest,
}: {
  item: CompetitionListItem;
  currentYear: number;
  interest?: CompetitionInterest;
}) {
  const meta = metaLine(competition);
  const popular =
    interest !== undefined &&
    isPopularCompetition(interest.countOf(competition.id));
  const weekday = weekdayOf(competition.date);
  const interested = interest?.isInterested(competition.id) ?? false;

  return (
    // id는 마감 배너(#344)에서 누르면 이 줄로 내려오는 데 쓴다. 위에 붙은 필터 줄에 가리지 않게 여백을 둔다.
    <li
      id={competitionRowId(competition.id)}
      tabIndex={-1}
      className="flex scroll-mt-20 items-start gap-2 outline-none"
    >
      {/* 날짜 칸은 면·테두리 없이 흰 바탕에 글자만 — 흰 바탕이 뒤의 세로 줄을 가려 날짜가 줄 위에 놓인 듯 보인다. */}
      <time
        dateTime={competition.date}
        className="relative flex h-14 w-9 flex-none flex-col items-center justify-center bg-surface-container"
      >
        <span className="text-[18px] leading-[22px] font-bold text-text-primary tabular-nums">
          {Number(competition.date.slice(8, 10))}
        </span>
        <span
          className={cn(
            "text-[12px] leading-[16px] font-medium",
            weekday.index === 0 && "text-text-error",
            weekday.index === 6 && "text-primary",
            weekday.index > 0 && weekday.index < 6 && "text-text-secondary",
          )}
        >
          {weekday.label}
        </span>
      </time>
      <div className="min-w-0 flex-1 rounded-20 bg-surface-field px-4 pt-3.5 pb-3">
        <h3 className="text-[16px] leading-[22px] font-bold break-keep text-text-primary [overflow-wrap:anywhere]">
          {competition.name}
        </h3>
        {meta ? (
          <p className="mt-0.5 text-[14px] leading-[20px] text-text-secondary">
            {meta}
          </p>
        ) : null}
        {registration || popular || interest ? (
          <div className="mt-2.5 flex items-center gap-1.5">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
              {registration ? (
                <RegistrationChip
                  status={registration}
                  // 남은 날은 관심 대회에만 — 챙겨 볼 날짜만 숫자로 띄운다.
                  dday={interested}
                  currentYear={currentYear}
                />
              ) : null}
              {popular ? (
                <StatusChip tone="hot" icon={<FlameIcon size={16} />}>
                  {/* 보이는 글자는 짧게 HOT, 읽어 주는 이름은 뜻 그대로. */}
                  <span aria-hidden>HOT</span>
                  <span className="sr-only">관심 많은 대회</span>
                </StatusChip>
              ) : null}
            </div>
            {interest ? (
              <InterestButton
                competitionName={competition.name}
                interested={interested}
                count={interest.countOf(competition.id)}
                onToggle={() => interest.toggle(competition.id)}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}

/**
 * 접수 칩 끝에 붙는 남은 날 — 관심 대회에만 그린다.
 * 접수 중: "D-2"(당일은 "오늘 마감", 얼리버드 마감이 먼저면 "얼리버드 D-2") · 접수 예정: 여는 날 "11.10 오픈"
 * (해가 다르면 "2027.1.5 오픈"). 마감 대회는 없다.
 */
function deadlineLabel(
  status: Exclude<RegistrationStatus, { kind: "closed" }>,
  currentYear: number,
): { text: string; urgent: boolean } {
  switch (status.kind) {
    case "open": {
      const earlyBird = status.deadline === "early-bird";
      const days = status.daysLeft === 0 ? "오늘 마감" : `D-${status.daysLeft}`;
      return { text: earlyBird ? `얼리버드 ${days}` : days, urgent: earlyBird };
    }
    case "upcoming": {
      const [year, month, day] = status.opensOn.split("-").map(Number);
      // 12월에 보는 내년 1월 오픈이 지난 날짜로 읽히지 않게 해가 다르면 연도를 붙인다.
      const date =
        year === currentYear ? `${month}.${day}` : `${year}.${month}.${day}`;
      return { text: `${date} 오픈`, urgent: false };
    }
  }
}

/**
 * 상태 칩 — 박스 아래 칩 줄의 알약.
 *
 * 색 면은 접수 중(파랑) 하나다 — 가장 옅은 파랑은 회색 박스와 밝기가 같아 묻혀서 한 단계 진한 파랑(subtle-strong)을 쓴다. 접수 예정·HOT·마감은 회색 박스 위에 흰 면으로 띄운다 — 옅은 빨강 면은 회색 위에서
 * 묻혀서, HOT은 흰 면 + 굵은 빨강 글자로 띄운다(마감은 흐린 글자).
 * 누르는 칩(필터 줄)과 헷갈리지 않게 테두리 없이 면만 쓴다. 폰에서 앞 아이콘이 읽히게 아이콘 16 · 높이 26 · 글자 13.
 * 앞 아이콘은 글자색을 따른다 — HOT의 불꽃만 제 색(빨강 + 노랑 속불)을 갖는다.
 */
function StatusChip({
  tone,
  icon,
  children,
}: {
  tone: "primary" | "neutral" | "disabled" | "hot";
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[26px] items-center gap-1 rounded-full pr-2.5 pl-1.5 text-[13px] leading-none font-semibold whitespace-nowrap",
        tone === "primary" && "bg-surface-primary-subtle-strong text-primary",
        tone === "neutral" && "bg-surface-container text-text-secondary-strong",
        tone === "disabled" && "bg-surface-container text-text-disabled",
        tone === "hot" && "bg-surface-container font-bold text-text-error",
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/**
 * 접수 상태 칩 — 접수 중(파랑 면) · 접수 예정(흰 면) · 접수 마감(흰 면, 흐린 글자).
 * `dday`면 칩 끝에 남은 날을 붙인다(가는 점으로 띄움). 얼리버드 마감은 칩 글자를 "얼리버드 D-2"로 바꾼다.
 */
function RegistrationChip({
  status,
  dday,
  currentYear,
}: {
  status: RegistrationStatus;
  dday: boolean;
  currentYear: number;
}) {
  const deadline =
    dday && status.kind !== "closed"
      ? deadlineLabel(status, currentYear)
      : null;
  const suffix = deadline ? (
    <>
      <span aria-hidden className="opacity-40">
        ·
      </span>
      <span className="font-bold tabular-nums">{deadline.text}</span>
    </>
  ) : null;
  switch (status.kind) {
    case "upcoming":
      return (
        <StatusChip
          tone="neutral"
          icon={<RegistrationIcon stage="before" size={16} />}
        >
          접수 예정
          {suffix}
        </StatusChip>
      );
    case "closed":
      return (
        <StatusChip
          tone="disabled"
          icon={<RegistrationIcon stage="closed" size={16} />}
        >
          접수 마감
        </StatusChip>
      );
    case "open":
      return (
        <StatusChip
          tone="primary"
          icon={<RegistrationIcon stage="open" size={16} />}
        >
          {/* 얼리버드 마감이 먼저면 "얼리버드 D-2"만 — 칩이 한 줄에 들어가게 줄이고, 파란 칩 안에 빨강을 섞지 않는다. */}
          {deadline?.urgent ? (
            <span className="font-bold tabular-nums">{deadline.text}</span>
          ) : (
            <>접수 중{suffix}</>
          )}
        </StatusChip>
      );
  }
}

/**
 * 관심 버튼 (#335·#348) — 칩 줄 끝의 하트와 익명 관심 수.
 *
 * 커뮤니티 글의 좋아요와 같은 하트·색 토큰을 쓴다: 등록 전 옅은 회색 선, 등록하면 빨강 채움.
 * 관심 수는 아무도 없으면 빼서 "0"이 줄마다 늘어서지 않게 한다. 누가 눌렀는지는 보여 주지 않는다.
 * 보이는 크기는 칩 줄 높이에 맞추고, 누를 자리는 음수 여백으로 44×44를 지킨다.
 */
function InterestButton({
  competitionName,
  interested,
  count,
  onToggle,
}: {
  competitionName: string;
  interested: boolean;
  count: number;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={interested}
      aria-label={`${competitionName} 관심 등록${count > 0 ? `, 관심 ${count}명` : ""}`}
      className={cn(
        "-my-2.5 -mr-2 flex min-h-11 min-w-11 flex-none items-center justify-center gap-1 rounded-10 px-2",
        SURFACE_PRESS,
      )}
    >
      <HeartIcon
        size={18}
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
