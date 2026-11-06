import type {
  CompetitionListItem,
  CompetitionListMonth,
} from "@/features/competition/application/get-competition-list-page-data";
import type {
  Competition,
  CompetitionDivision,
} from "@/features/competition/domain/competition";
import type { RegistrationStatus } from "@/features/competition/domain/competition-registration";
import type { CompetitionInterest } from "@/features/competition/presentation/use-competition-interest";
import { cn } from "@/shared/lib/cn";
import { BookmarkIcon } from "@/shared/ui/icons";
import { SURFACE_PRESS } from "@/shared/ui/press-styles";

/**
 * 한 달 묶음 — 달 이름 아래 옅은 면 하나에 그 달 대회 줄을 모은다 (#332), 줄마다 접수 상태 (#333).
 *
 * 줄마다 왼쪽에 날짜·요일, 오른쪽에 이름 · "장소 · 부문 · 대상" · 접수 상태. 대회끼리는 선 대신 간격으로 나눈다.
 * 상태가 없어 서버·클라이언트 어디서든 그릴 수 있다(필터 화면이 클라이언트에서 그린다).
 */
export function MonthSection({
  month,
  currentYear,
  interest,
}: {
  month: CompetitionListMonth;
  currentYear: number;
  /** 넘기면 줄마다 오른쪽에 관심 버튼과 관심 수를 단다(#335). */
  interest?: CompetitionInterest;
}) {
  const headingId = `competition-month-${month.year}-${month.month}`;
  // 올해는 "11월", 해가 바뀌면 "2027년 1월" — 연말에 다음 해 대회가 섞여도 헷갈리지 않게.
  const label =
    month.year === currentYear
      ? `${month.month}월`
      : `${month.year}년 ${month.month}월`;

  return (
    <section aria-labelledby={headingId} className="pb-2">
      <h2
        id={headingId}
        className="px-4 pt-4 pb-2 text-[15px] leading-[22px] font-bold text-section-header-title"
      >
        {label}
      </h2>
      <ul className="mx-2 flex flex-col rounded-20 bg-surface-field-subtle px-3 py-1">
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

/** 대회 한 줄. 달력 보기의 그날 대회 목록도 같은 줄을 쓴다. */
export function CompetitionRow({
  item: { competition, registration },
  currentYear,
  interest,
}: {
  item: CompetitionListItem;
  currentYear: number;
  interest?: CompetitionInterest;
}) {
  const day = Number(competition.date.slice(8, 10));
  const weekday = weekdayOf(competition.date);
  // 장소·부문이 아직 안 정해진 대회는 둘째 줄을 통째로 뺀다 — 빈 줄이 높이만 차지하지 않게.
  const meta = metaLine(competition);

  return (
    <li className="flex gap-2.5 py-3">
      <time
        dateTime={competition.date}
        className="flex w-[30px] flex-none flex-col items-center"
      >
        <span className="text-[21px] leading-[25px] font-bold text-text-primary tabular-nums">
          {day}
        </span>
        <span
          className={cn(
            "text-[12px] leading-[15px]",
            weekday.index === 0 && "text-text-error",
            weekday.index === 6 && "text-primary",
            weekday.index > 0 && weekday.index < 6 && "text-text-secondary",
          )}
        >
          {weekday.label}
        </span>
      </time>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
        <h3 className="text-[16px] leading-[22px] font-bold break-keep text-text-primary">
          {competition.name}
        </h3>
        {meta ? (
          <p className="text-[13px] leading-[18px] text-text-secondary">
            {meta}
          </p>
        ) : null}
        {registration ? (
          <RegistrationLine status={registration} currentYear={currentYear} />
        ) : null}
      </div>
      {interest ? (
        <InterestButton
          competitionName={competition.name}
          interested={interest.isInterested(competition.id)}
          count={interest.countOf(competition.id)}
          onToggle={() => interest.toggle(competition.id)}
        />
      ) : null}
    </li>
  );
}

/**
 * 관심 버튼 (#335) — 북마크 아이콘 아래 익명 관심 수.
 *
 * 커뮤니티 글의 저장(북마크)과 같은 아이콘·색 토큰을 쓴다: 등록 전 옅은 회색 선, 등록하면 파랑 채움.
 * 관심 수는 아무도 없으면 빼서 "0"이 줄마다 늘어서지 않게 한다. 누가 눌렀는지는 보여 주지 않는다.
 * 줄 오른쪽 위(이름 높이)에 붙여 대회마다 같은 자리에 온다.
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
        // 관심 수가 없어도 누를 자리는 44×44를 지킨다.
        "-my-1 -mr-1 flex min-h-11 w-11 flex-none flex-col items-center gap-0.5 self-start rounded-10 py-1.5",
        SURFACE_PRESS,
      )}
    >
      <BookmarkIcon
        size={20}
        filled={interested}
        className={
          interested
            ? "text-reaction-bar-active-bookmark-icon"
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
 * 접수 상태 줄 — "접수 중 · 마감 D-12".
 *
 * 앞의 상태 이름만 굵게 색을 입히고(접수 중 = 파랑), 얼리버드 마감이 D-7 안이면 뒤의 남은 날도 빨강으로
 * 강조한다. 놓치면 참가비가 오르는 유일한 신호라 한 줄에서 이것만 빨강이다.
 * 접수 예정의 시안 색(주황)은 색 토큰에 없어 짙은 회색으로 둔다.
 */
function RegistrationLine({
  status,
  currentYear,
}: {
  status: RegistrationStatus;
  currentYear: number;
}) {
  return (
    <p className="mt-0.5 text-[13px] leading-[18px] text-text-secondary">
      {registrationParts(status, currentYear)}
    </p>
  );
}

function registrationParts(status: RegistrationStatus, currentYear: number) {
  switch (status.kind) {
    case "upcoming":
      return (
        <>
          <b className="font-semibold text-text-secondary-strong">접수 예정</b>
          {` · ${shortDate(status.opensOn, currentYear)} 오픈`}
        </>
      );
    case "closed":
      return <b className="font-semibold text-text-disabled">접수 마감</b>;
    case "open": {
      const label =
        status.deadline === "early-bird"
          ? `얼리버드 ${dDayLabel(status.daysLeft)}`
          : dDayLabel(status.daysLeft);
      return (
        <>
          <b className="font-semibold text-primary">접수 중</b>
          {" · "}
          {status.deadline === "early-bird" ? (
            <b className="font-semibold text-text-error">{label}</b>
          ) : (
            label
          )}
        </>
      );
    }
  }
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
