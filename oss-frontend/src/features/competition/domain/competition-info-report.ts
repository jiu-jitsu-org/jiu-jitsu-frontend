/**
 * 대회 정보 제보 (#365) — "정보가 달라요". 무엇이 다른지 하나를 고르고, "다른 정보"면 직접 적어 보낸다.
 */
export const COMPETITION_INFO_REPORT_REASONS = [
  { value: "date", label: "일시가 달라요" },
  { value: "place", label: "장소가 달라요" },
  { value: "schedule", label: "접수 일정이 달라요" },
  { value: "fee", label: "참가비가 달라요" },
  { value: "other", label: "다른 정보가 달라요", allowsCustomText: true },
] as const;

/** 무엇이 다른지 직접 적는 칸의 최대 글자 수 */
export const COMPETITION_INFO_REPORT_DETAIL_MAX_LENGTH = 200;

export type CompetitionInfoReportReason =
  (typeof COMPETITION_INFO_REPORT_REASONS)[number]["value"];

export function isCompetitionInfoReportReason(
  value: unknown,
): value is CompetitionInfoReportReason {
  return COMPETITION_INFO_REPORT_REASONS.some((reason) => reason.value === value);
}

export interface CompetitionInfoReportRepository {
  report(
    competitionId: string,
    reason: CompetitionInfoReportReason,
    detail?: string,
  ): Promise<void>;
}
