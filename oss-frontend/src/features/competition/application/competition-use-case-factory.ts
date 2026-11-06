import { GetCompetitionInterestCountsUseCase } from "@/features/competition/application/get-competition-interest-counts";
import { GetCompetitionListUseCase } from "@/features/competition/application/get-competition-list";
import { GetInterestedCompetitionIdsUseCase } from "@/features/competition/application/get-interested-competition-ids";
import { SetCompetitionInterestUseCase } from "@/features/competition/application/set-competition-interest";
import { FixtureCompetitionInterestRepository } from "@/features/competition/infrastructure/fixture-competition-interest-repository";
import { FixtureCompetitionRepository } from "@/features/competition/infrastructure/fixture-competition-repository";

/**
 * 대회 feature 의존성 조립.
 *
 * 대회 목록·관심 등록 API가 아직 없어 고정 데이터 저장소를 끼운다. API가 나오면 여기서
 * createServerHttpClient 기반 External 저장소로 바꾼다 — 위 계층은 그대로 둔다.
 */
export function createGetCompetitionListUseCase(): GetCompetitionListUseCase {
  return new GetCompetitionListUseCase(new FixtureCompetitionRepository());
}

export function createGetInterestedCompetitionIdsUseCase(): GetInterestedCompetitionIdsUseCase {
  return new GetInterestedCompetitionIdsUseCase(
    new FixtureCompetitionInterestRepository(),
  );
}

export function createGetCompetitionInterestCountsUseCase(): GetCompetitionInterestCountsUseCase {
  return new GetCompetitionInterestCountsUseCase(
    new FixtureCompetitionInterestRepository(),
  );
}

export function createSetCompetitionInterestUseCase(): SetCompetitionInterestUseCase {
  return new SetCompetitionInterestUseCase(
    new FixtureCompetitionInterestRepository(),
  );
}
