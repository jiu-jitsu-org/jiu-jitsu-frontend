import type {
  CompetitionAlertSettings,
  CompetitionNoticeResult,
} from "@/features/competition/domain/competition-alert";
import type { CompetitionAlertRepository } from "@/features/competition/domain/competition-alert-repository";
import type { CompetitionInterestRepository } from "@/features/competition/domain/competition-interest-repository";

/** 관심 대회 알림 설정 읽기 (#375 · #422). */
export class GetCompetitionAlertSettingsUseCase {
  constructor(private readonly alertRepository: CompetitionAlertRepository) {}

  execute(): Promise<CompetitionAlertSettings> {
    return this.alertRepository.getSettings();
  }
}

/** 첫 관심 등록 시트의 답 (#375) — '알림 받기'면 켜고, '나중에'면 물어본 것만 남긴다. */
export class AnswerCompetitionAlertPromptUseCase {
  constructor(private readonly alertRepository: CompetitionAlertRepository) {}

  execute(enabled: boolean): Promise<void> {
    return this.alertRepository.answerPrompt(enabled);
  }
}

/** 이 대회 알림 켜기·끄기 (#376 · #377). 켜면 관심도 함께 등록되고, 끄면 관심은 그대로다. */
export class SetCompetitionNoticeUseCase {
  constructor(
    private readonly interestRepository: CompetitionInterestRepository,
  ) {}

  execute(competitionId: number, enabled: boolean): Promise<CompetitionNoticeResult> {
    return this.interestRepository.setNotice(competitionId, enabled);
  }
}
