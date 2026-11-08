import type {
  CompetitionInfoReportReason,
  CompetitionInfoReportRepository,
} from "@/features/competition/domain/competition-info-report";

/**
 * 제보 API가 나오기 전까지 쓰는 저장소 (#365). 받은 제보를 서버 메모리에만 쌓는다 — 화면 흐름을 먼저 만들기 위해서다.
 */
const STORE_KEY = Symbol.for("oss.fixture.competition-info-reports");

/** 서버 메모리가 한없이 늘지 않게 최근 제보만 남긴다. */
const MAX_REPORTS = 500;

type StoredReport = {
  competitionId: string;
  reason: CompetitionInfoReportReason;
  detail?: string;
  reportedAt: string;
};

export class FixtureCompetitionInfoReportRepository
  implements CompetitionInfoReportRepository
{
  async report(
    competitionId: string,
    reason: CompetitionInfoReportReason,
    detail?: string,
  ): Promise<void> {
    const scope = globalThis as typeof globalThis & {
      [STORE_KEY]?: StoredReport[];
    };
    scope[STORE_KEY] ??= [];
    scope[STORE_KEY].push({
      competitionId,
      reason,
      detail,
      reportedAt: new Date().toISOString(),
    });
    if (scope[STORE_KEY].length > MAX_REPORTS) scope[STORE_KEY].shift();
  }
}
