/**
 * 대회 정보 제보 (#365 · #420) — "정보가 달라요". 무엇이 다른지 하나를 고르고, 맞는 정보를 아시면 함께 적는다.
 *
 * 적는 칸은 모든 항목에 열린다 — 맞는 값이 같이 오면 운영자가 공지를 다시 찾지 않고 바로 고친다.
 * "다른 정보"만 꼭 적어야 한다(무엇이 다른지 고른 항목으로 알 수 없다).
 */
export const COMPETITION_INFO_REPORT_REASONS = [
  { value: "date", label: "일시가 달라요", allowsCustomText: true },
  { value: "place", label: "장소가 달라요", allowsCustomText: true },
  { value: "schedule", label: "접수 일정이 달라요", allowsCustomText: true },
  { value: "fee", label: "참가비가 달라요", allowsCustomText: true },
  { value: "other", label: "다른 정보가 달라요", allowsCustomText: true },
] as const;

/** 적는 칸의 최대 글자 수 */
export const COMPETITION_INFO_REPORT_DETAIL_MAX_LENGTH = 200;

/** 같은 사람·같은 대회·같은 항목은 하루(서울 자정 기준)에 이 횟수까지 보낼 수 있다. 항목이 다르면 따로 센다. */
export const COMPETITION_INFO_REPORT_DAILY_LIMIT = 3;

export type CompetitionInfoReportReason =
  (typeof COMPETITION_INFO_REPORT_REASONS)[number]["value"];

export function isCompetitionInfoReportReason(
  value: unknown,
): value is CompetitionInfoReportReason {
  return COMPETITION_INFO_REPORT_REASONS.some((reason) => reason.value === value);
}

/** 적는 칸을 꼭 채워야 하는 항목인지 — "다른 정보"만. */
export function requiresReportDetail(reason: CompetitionInfoReportReason): boolean {
  return reason === "other";
}

/** 오늘 이 항목을 이미 하루 횟수만큼 보냈을 때. */
export class CompetitionInfoReportLimitError extends Error {
  constructor() {
    super("Competition info report daily limit exceeded");
    this.name = "CompetitionInfoReportLimitError";
  }
}

export interface CompetitionInfoReportRepository {
  report(
    competitionId: number,
    reason: CompetitionInfoReportReason,
    detail?: string,
  ): Promise<void>;
}
