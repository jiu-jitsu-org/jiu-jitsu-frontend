import type { CompetitionEntryLink } from "@/features/competition/domain/competition-entry-link";
import type { CompetitionRegion } from "@/features/competition/domain/competition-region";
import type { CompetitionRegistration } from "@/features/competition/domain/competition-registration";

/** 대회 부문 — 도복(gi) · 노기(nogi). 한 대회가 둘 다 열 수 있다. */
export type CompetitionDivision = "gi" | "nogi";

/**
 * 대회 접수·진행 상태 — 서버가 응답의 today 기준으로 정해 준다(backend#193).
 * 접수 예정(접수 시작 전) · 접수 중 · 접수 마감(대회 전) · 종료(대회일 지남).
 * 비어 있는 일정은 제약으로 보지 않는다 — 접수 일정을 모르는 다가오는 대회는 접수 중이다.
 */
export type CompetitionStatus = "upcoming" | "open" | "closed" | "ended";

export type Competition = {
  /** 대회 id(backend competitionId) */
  id: number;
  name: string;
  /** 대회 날짜 — 한국 날짜 "YYYY-MM-DD". 시각은 없다. */
  date: string;
  /** 목록에 그대로 보이는 짧은 장소 표기. 예: "서울 송파". 모르면 빈 문자열. */
  place: string;
  /** 시·도 — 지역 필터용. 장소가 아직 안 정해진 대회는 없다. */
  region?: CompetitionRegion;
  divisions: CompetitionDivision[];
  /** 참가 대상이 제한된 대회만 갖는다. 예: "키즈" */
  audience?: string;
  status: CompetitionStatus;
  /** 얼리버드 접수 중인지 — 접수 중이고 얼리버드 마감이 아직 안 지났다. */
  earlyBirdOpen: boolean;
  /** 접수 일정. 하나도 공지되지 않은 대회는 없다. */
  registration?: CompetitionRegistration;
  viewCount: number;
  /** 익명 관심 수 */
  interestCount: number;
  /** 내가 관심 등록했는지 — 비로그인이면 false */
  interested: boolean;
  /** 시작 시각 "HH:MM" — 상세(#361). 공지되지 않았으면 없다. */
  startTime?: string;
  /** 경기장 이름 — 상세에서 장소 뒤에 붙인다. 예: "송파 올림픽홀" */
  venue?: string;
  /** 주최 단체 이름 */
  host?: string;
  /** 대회사가 올린 공지 주소. 접수 상태와 상관없이 이 공지로 보낸다. */
  noticeUrl?: string;
  /** 접수 사이트의 상태 링크(#469) — 상세에만 온다. 서버가 보이는 기간 · 운영자 확인으로 거른 것. */
  entryLinks?: CompetitionEntryLink[];
  /** 참가비 단계(#364) — 서버가 정한 순서. 모르면 빈 배열(목록 항목에는 없다). */
  fees?: CompetitionFee[];
  /** 참가비 기준 한 줄. 예: "성인 1종목 기준" */
  feeNote?: string;
  /** 대회 공지와 마지막으로 맞춰 본 날 "YYYY-MM-DD"(#365). 아직 확인하지 못한 대회는 없다. */
  verifiedOn?: string;
  /** 이 대회 마감 알림을 켰는지(#376) — 상세에만 온다. 실제 수신은 설정의 관심 대회 알림도 켜져 있어야 한다. */
  noticeEnabled?: boolean;
};

/**
 * 참가비 한 단계. 얼리버드처럼 기한이 있는 단계는 until(그날 포함)을 갖고, 기본 참가비는 없다.
 * 금액은 원 단위 정수. 0은 무료다.
 */
export type CompetitionFee = {
  label: string;
  amount: number;
  until?: string;
};

/** 대회 목록 한 페이지 — 날짜순(오름차순). */
export type CompetitionPage = {
  /** 서버가 본 오늘 — 한국 날짜 "YYYY-MM-DD". 남은 날·상태 계산 기준. */
  today: string;
  competitions: Competition[];
  /** 더 이른 대회를 이어 받는 커서. 없으면 null. */
  previousCursor: string | null;
  /** 더 늦은 대회를 이어 받는 커서. 없으면 null. */
  nextCursor: string | null;
};

/** 목록 한 번에 받는 대회 수 — 한 달 평균 십여 건이라 두세 달치. 더 내리면 이어 받는다. */
export const COMPETITION_LIST_PAGE_SIZE = 50;

/** 달력 한 달·관심 대회처럼 한 번에 다 받는 목록의 크기 — 서버 상한. */
export const COMPETITION_FULL_PAGE_SIZE = 100;

/**
 * 대회 목록 조회 조건 — 모두 "그리고"로 겹친다. 지역·상태는 고른 것 중 하나면 통과.
 * date와 cursor는 함께 쓰지 않는다 — 커서로 이어 받을 때는 date를 빼고 나머지 조건을 처음과 같게 둔다.
 */
export type CompetitionListQuery = {
  /** 이 날(포함) 이후 대회부터. 없으면 서버의 오늘. "YYYY-MM-DD" */
  date?: string;
  cursor?: string;
  /** 1~100 */
  size?: number;
  regions?: readonly CompetitionRegion[];
  statuses?: readonly CompetitionStatus[];
  /** 내가 관심 등록한 대회만 — 로그인해야 부를 수 있다. */
  interested?: boolean;
  keyword?: string;
};

/** 같은 달에 열리는 묶음. 월은 1부터. */
export type MonthGroup<T> = {
  year: number;
  month: number;
  items: T[];
};

/** 날짜순 목록을 월별로 묶는다. 서버가 날짜순으로 주므로 순서는 그대로 둔다. */
export function groupByMonth<T>(
  items: readonly T[],
  dateOf: (item: T) => string,
): MonthGroup<T>[] {
  const months: MonthGroup<T>[] = [];
  for (const item of items) {
    const [year, month] = dateOf(item).split("-").map(Number);
    const last = months.at(-1);
    if (last && last.year === year && last.month === month) {
      last.items.push(item);
    } else {
      months.push({ year, month, items: [item] });
    }
  }
  return months;
}

/** 대회 id 모양인지 — 양의 정수. 화면 밖에서 들어오는 값(주소·Server Action 인자)을 거른다. */
export function isCompetitionId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

/** 주소 조각("12")을 대회 id로. 모양이 틀리면 null. */
export function parseCompetitionId(value: string): number | null {
  if (!/^\d{1,15}$/.test(value)) return null;
  const id = Number(value);
  return isCompetitionId(id) ? id : null;
}

/** 없거나 미공개로 바뀐 대회에 관심·알림·제보를 하려 할 때(서버 404 C0010). */
export class CompetitionNotFoundError extends Error {
  constructor(competitionId: number) {
    super(`Competition not found: ${competitionId}`);
    this.name = "CompetitionNotFoundError";
  }
}
