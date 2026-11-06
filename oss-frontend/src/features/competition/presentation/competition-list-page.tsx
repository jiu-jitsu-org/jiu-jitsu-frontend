import type {
  Competition,
  CompetitionDivision,
  CompetitionMonth,
} from "@/features/competition/domain/competition";
import type { CompetitionListPageData } from "@/features/competition/application/get-competition-list-page-data";
import { FeedErrorState } from "@/features/community/presentation/feed-error-state";
import { cn } from "@/shared/lib/cn";
import { EmptyState } from "@/shared/ui/empty-state";

/**
 * 대회 탭 첫 화면 — 월별 묶음 + 대회 줄 (#332).
 *
 * 앱 하단 탭이 웹뷰로 띄우는 화면이다. 위 헤더와 아래 탭 바는 앱 쪽에 있어 웹은 안전 영역 여백을
 * 따로 두지 않는다(홈 피드와 같은 기준). 상태가 없어 Server Component로 그린다.
 *
 * 모양은 대회 기능 제안서의 목록 시안을 따른다: 달 이름 아래 옅은 면 하나에 그 달 대회를 모으고,
 * 줄마다 왼쪽에 날짜·요일, 오른쪽에 이름과 "장소 · 부문 · 대상". 대회끼리는 선 대신 간격으로 나눈다.
 */
export function CompetitionListPage({
  data,
}: {
  data: CompetitionListPageData;
}) {
  return (
    <main className="min-h-screen bg-surface-container">
      {renderBody(data)}
    </main>
  );
}

function renderBody(data: CompetitionListPageData) {
  // 불러오기 실패는 홈 피드와 같은 화면(안내 + 재시도)을 쓴다 — 탭마다 실패 모양이 다르지 않게.
  if (!data.ok) return <FeedErrorState />;
  if (data.months.length === 0) {
    return (
      <EmptyState
        title="예정된 대회가 없어요"
        description="새 대회가 올라오면 여기에 보여 드릴게요"
        className="pt-[35vh]"
      />
    );
  }
  return (
    <div className="pt-1 pb-6">
      {data.months.map((month) => (
        <MonthSection
          key={`${month.year}-${month.month}`}
          month={month}
          currentYear={data.currentYear}
        />
      ))}
    </div>
  );
}

function MonthSection({
  month,
  currentYear,
}: {
  month: CompetitionMonth;
  currentYear: number;
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
        {month.competitions.map((competition) => (
          <CompetitionRow key={competition.id} competition={competition} />
        ))}
      </ul>
    </section>
  );
}

function CompetitionRow({ competition }: { competition: Competition }) {
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
      </div>
    </li>
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
