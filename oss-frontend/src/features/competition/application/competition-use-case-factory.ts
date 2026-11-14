import {
  AnswerCompetitionAlertPromptUseCase,
  GetCompetitionAlertSettingsUseCase,
  SetCompetitionNoticeUseCase,
} from "@/features/competition/application/competition-alert-settings";
import { GetCompetitionDetailUseCase } from "@/features/competition/application/get-competition-detail";
import { GetCompetitionListUseCase } from "@/features/competition/application/get-competition-list";
import { GetCompetitionPickerUseCase } from "@/features/competition/application/get-competition-picker";
import { GetCompetitionRegionsUseCase } from "@/features/competition/application/get-competition-regions";
import { GetCompetitionStoriesUseCase } from "@/features/competition/application/get-competition-stories";
import { RecordCompetitionViewUseCase } from "@/features/competition/application/record-competition-view";
import { ReportCompetitionInfoUseCase } from "@/features/competition/application/report-competition-info";
import { SetCompetitionInterestUseCase } from "@/features/competition/application/set-competition-interest";
import { ExternalCompetitionAlertRepository } from "@/features/competition/infrastructure/external-competition-alert-repository";
import { ExternalCompetitionInfoReportRepository } from "@/features/competition/infrastructure/external-competition-info-report-repository";
import { ExternalCompetitionInterestRepository } from "@/features/competition/infrastructure/external-competition-interest-repository";
import { ExternalCompetitionRepository } from "@/features/competition/infrastructure/external-competition-repository";
import {
  createAuthedServerHttpClient,
  createServerHttpClient,
} from "@/shared/lib/http/create-server-http-client";

/**
 * 대회 feature 의존성 조립 — 대회 API(backend#193) External 저장소.
 *
 * 읽기는 토큰이 있으면 authed 클라이언트로 내 관심(interested)까지 받고, 없으면 익명으로 읽는다(커뮤니티 읽기와 같은 기준).
 * 관심·알림·제보 쓰기와 알림 설정은 로그인 전용이라 토큰을 강제한다.
 */
function createReadRepository(
  accessToken: string | null,
): ExternalCompetitionRepository {
  return new ExternalCompetitionRepository(
    accessToken
      ? createAuthedServerHttpClient(accessToken)
      : createServerHttpClient(),
  );
}

export function createGetCompetitionListUseCase(
  accessToken: string | null,
): GetCompetitionListUseCase {
  return new GetCompetitionListUseCase(createReadRepository(accessToken));
}

export function createGetCompetitionDetailUseCase(
  accessToken: string | null,
): GetCompetitionDetailUseCase {
  return new GetCompetitionDetailUseCase(createReadRepository(accessToken));
}

/** 조회수는 익명 숫자라 토큰 없이 센다. */
export function createRecordCompetitionViewUseCase(): RecordCompetitionViewUseCase {
  return new RecordCompetitionViewUseCase(createReadRepository(null));
}

export function createGetCompetitionStoriesUseCase(
  accessToken: string | null,
): GetCompetitionStoriesUseCase {
  return new GetCompetitionStoriesUseCase(createReadRepository(accessToken));
}

export function createGetCompetitionPickerUseCase(
  accessToken: string | null,
): GetCompetitionPickerUseCase {
  return new GetCompetitionPickerUseCase(createReadRepository(accessToken));
}

/** 대회 있는 지역은 내 정보와 무관해 토큰 없이 읽는다. */
export function createGetCompetitionRegionsUseCase(): GetCompetitionRegionsUseCase {
  return new GetCompetitionRegionsUseCase(createReadRepository(null));
}

export function createSetCompetitionInterestUseCase(
  accessToken: string,
): SetCompetitionInterestUseCase {
  return new SetCompetitionInterestUseCase(
    new ExternalCompetitionInterestRepository(
      createAuthedServerHttpClient(accessToken),
    ),
  );
}

export function createSetCompetitionNoticeUseCase(
  accessToken: string,
): SetCompetitionNoticeUseCase {
  return new SetCompetitionNoticeUseCase(
    new ExternalCompetitionInterestRepository(
      createAuthedServerHttpClient(accessToken),
    ),
  );
}

export function createReportCompetitionInfoUseCase(
  accessToken: string,
): ReportCompetitionInfoUseCase {
  return new ReportCompetitionInfoUseCase(
    new ExternalCompetitionInfoReportRepository(
      createAuthedServerHttpClient(accessToken),
    ),
  );
}

export function createGetCompetitionAlertSettingsUseCase(
  accessToken: string,
): GetCompetitionAlertSettingsUseCase {
  return new GetCompetitionAlertSettingsUseCase(
    new ExternalCompetitionAlertRepository(
      createAuthedServerHttpClient(accessToken),
    ),
  );
}

export function createAnswerCompetitionAlertPromptUseCase(
  accessToken: string,
): AnswerCompetitionAlertPromptUseCase {
  return new AnswerCompetitionAlertPromptUseCase(
    new ExternalCompetitionAlertRepository(
      createAuthedServerHttpClient(accessToken),
    ),
  );
}
