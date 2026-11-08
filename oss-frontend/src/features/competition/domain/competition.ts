import type { CompetitionRegion } from "@/features/competition/domain/competition-region";
import type { CompetitionRegistration } from "@/features/competition/domain/competition-registration";

/** 대회 부문 — 도복(gi) · 노기(nogi). 한 대회가 둘 다 열 수 있다. */
export type CompetitionDivision = "gi" | "nogi";

export type Competition = {
  id: string;
  name: string;
  /** 대회 날짜 — 한국 날짜 "YYYY-MM-DD". 시각은 없다. */
  date: string;
  /** 목록에 그대로 보이는 짧은 장소 표기. 예: "서울 송파" */
  place: string;
  /** 시·도 — 지역 필터용. 장소가 아직 안 정해진 대회는 없다. */
  region?: CompetitionRegion;
  divisions: CompetitionDivision[];
  /** 참가 대상이 제한된 대회만 갖는다. 예: "키즈" */
  audience?: string;
  /** 접수 일정. 아직 공지되지 않은 대회는 없다. */
  registration?: CompetitionRegistration;
  /** 시작 시각 "HH:MM" — 상세(#361). 공지되지 않았으면 없다. */
  startTime?: string;
  /** 경기장 이름 — 상세에서 장소 뒤에 붙인다. 예: "송파 올림픽홀" */
  venue?: string;
  /** 주최 단체 이름 */
  host?: string;
  /** 대회사가 올린 공지 주소. 접수 상태와 상관없이 이 공지로 보낸다. */
  noticeUrl?: string;
  /** 참가비 단계(#364) — 싼 단계부터. 성인 1종목 기준. 공지되지 않았으면 없다. */
  fees?: CompetitionFee[];
  /** 대회 공지와 마지막으로 맞춰 본 날 "YYYY-MM-DD"(#365). 아직 확인하지 못한 대회는 없다. */
  verifiedOn?: string;
};

/**
 * 참가비 한 단계. 얼리버드처럼 기한이 있는 단계는 until(그날 포함)을 갖고, 기본 참가비는 없다.
 * 금액은 원 단위 정수.
 */
export type CompetitionFee = {
  label: string;
  amount: number;
  until?: string;
};

/** 같은 달에 열리는 대회 묶음. 월은 1부터. */
export type CompetitionMonth = {
  year: number;
  month: number;
  competitions: Competition[];
};

/**
 * 오늘(포함) 이후 대회만 날짜순으로 정렬해 월별로 묶는다.
 *
 * today는 한국 날짜 "YYYY-MM-DD". 날짜 문자열은 사전순 = 날짜순이라 문자열 비교로 충분하다.
 * 같은 날 대회는 이름순으로 둬서 새로고침마다 순서가 바뀌지 않게 한다.
 */
export function groupUpcomingByMonth(
  competitions: readonly Competition[],
  today: string,
): CompetitionMonth[] {
  const upcoming = competitions
    .filter((competition) => competition.date >= today)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.name.localeCompare(b.name, "ko"),
    );

  const months: CompetitionMonth[] = [];
  for (const competition of upcoming) {
    const [year, month] = competition.date.split("-").map(Number);
    const last = months.at(-1);
    if (last && last.year === year && last.month === month) {
      last.competitions.push(competition);
    } else {
      months.push({ year, month, competitions: [competition] });
    }
  }
  return months;
}
