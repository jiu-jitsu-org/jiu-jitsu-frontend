/** 대회 부문 — 도복(gi) · 노기(nogi). 한 대회가 둘 다 열 수 있다. */
export type CompetitionDivision = "gi" | "nogi";

export type Competition = {
  id: string;
  name: string;
  /** 대회 날짜 — 한국 날짜 "YYYY-MM-DD". 시각은 없다. */
  date: string;
  /** 목록에 그대로 보이는 짧은 장소 표기. 예: "서울 송파" */
  place: string;
  divisions: CompetitionDivision[];
  /** 참가 대상이 제한된 대회만 갖는다. 예: "키즈" */
  audience?: string;
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
