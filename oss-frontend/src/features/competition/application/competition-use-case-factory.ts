import { GetCompetitionDetailUseCase } from "@/features/competition/application/get-competition-detail";
import { GetCompetitionStoriesUseCase } from "@/features/competition/application/get-competition-stories";
import {
  GetPostCompetitionIdUseCase,
  LinkPostCompetitionUseCase,
} from "@/features/competition/application/link-post-competition";
import { RecordCompetitionViewUseCase } from "@/features/competition/application/record-competition-view";
import { ReportCompetitionInfoUseCase } from "@/features/competition/application/report-competition-info";
import { GetCompetitionInterestCountsUseCase } from "@/features/competition/application/get-competition-interest-counts";
import { GetCompetitionListUseCase } from "@/features/competition/application/get-competition-list";
import { GetInterestedCompetitionIdsUseCase } from "@/features/competition/application/get-interested-competition-ids";
import { SetCompetitionInterestUseCase } from "@/features/competition/application/set-competition-interest";
import { FixtureCompetitionInterestRepository } from "@/features/competition/infrastructure/fixture-competition-interest-repository";
import { FixtureCompetitionInfoReportRepository } from "@/features/competition/infrastructure/fixture-competition-info-report-repository";
import { FixtureCompetitionRepository } from "@/features/competition/infrastructure/fixture-competition-repository";
import { FixtureCompetitionStoryRepository } from "@/features/competition/infrastructure/fixture-competition-story-repository";
import { FixtureCompetitionViewRepository } from "@/features/competition/infrastructure/fixture-competition-view-repository";

/**
 * 대회 feature 의존성 조립.
 *
 * 대회 목록·상세·관심 등록·조회수·대회 이야기·제보 API가 아직 없어 고정 데이터 저장소를 끼운다. API가 나오면 여기서
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
    new FixtureCompetitionRepository(),
    new FixtureCompetitionInterestRepository(),
  );
}

export function createGetCompetitionDetailUseCase(): GetCompetitionDetailUseCase {
  return new GetCompetitionDetailUseCase(new FixtureCompetitionRepository());
}

export function createRecordCompetitionViewUseCase(): RecordCompetitionViewUseCase {
  return new RecordCompetitionViewUseCase(new FixtureCompetitionViewRepository());
}

export function createGetCompetitionStoriesUseCase(): GetCompetitionStoriesUseCase {
  return new GetCompetitionStoriesUseCase(new FixtureCompetitionStoryRepository());
}

export function createReportCompetitionInfoUseCase(): ReportCompetitionInfoUseCase {
  return new ReportCompetitionInfoUseCase(
    new FixtureCompetitionRepository(),
    new FixtureCompetitionInfoReportRepository(),
  );
}

export function createLinkPostCompetitionUseCase(): LinkPostCompetitionUseCase {
  return new LinkPostCompetitionUseCase(
    new FixtureCompetitionRepository(),
    new FixtureCompetitionStoryRepository(),
  );
}

export function createGetPostCompetitionIdUseCase(): GetPostCompetitionIdUseCase {
  return new GetPostCompetitionIdUseCase(new FixtureCompetitionStoryRepository());
}
