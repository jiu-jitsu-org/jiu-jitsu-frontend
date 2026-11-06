import { GetCompetitionListUseCase } from "@/features/competition/application/get-competition-list";
import { FixtureCompetitionRepository } from "@/features/competition/infrastructure/fixture-competition-repository";

/**
 * 대회 feature 의존성 조립.
 *
 * 대회 목록 API가 아직 없어 고정 데이터 저장소를 끼운다. API가 나오면 여기서
 * createServerHttpClient 기반 External 저장소로 바꾼다 — 위 계층은 그대로 둔다.
 */
export function createGetCompetitionListUseCase(): GetCompetitionListUseCase {
  return new GetCompetitionListUseCase(new FixtureCompetitionRepository());
}
