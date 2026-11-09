import type { CompetitionAlertSettings } from "@/features/competition/domain/competition-alert";
import type { CompetitionAlertRepository } from "@/features/competition/domain/competition-alert-repository";
import type { CompetitionRepository } from "@/features/competition/domain/competition-repository";
import { UnknownCompetitionError } from "@/features/competition/application/set-competition-interest";

/** 관심 대회 알림 설정 읽기 (#375 · #376). */
export class GetCompetitionAlertSettingsUseCase {
  constructor(private readonly alertRepository: CompetitionAlertRepository) {}

  execute(): Promise<CompetitionAlertSettings> {
    return this.alertRepository.getSettings();
  }
}

/** '관심 대회 알림' 전체 켜기·끄기 (#375) — 첫 관심 등록 시트의 '알림 받기'. */
export class SetCompetitionAlertsEnabledUseCase {
  constructor(private readonly alertRepository: CompetitionAlertRepository) {}

  execute(enabled: boolean): Promise<void> {
    return this.alertRepository.setEnabled(enabled);
  }
}

/**
 * 이 대회 알림만 끄기·다시 받기 (#376 · #377). 관심은 건드리지 않는다.
 * 있는 대회인지 먼저 본다 — Server Action은 누구나 부를 수 있어 아무 id나 쌓이지 않게(관심 등록과 같은 기준).
 */
export class SetCompetitionAlertMutedUseCase {
  constructor(
    private readonly competitionRepository: CompetitionRepository,
    private readonly alertRepository: CompetitionAlertRepository,
  ) {}

  async execute(competitionId: string, muted: boolean): Promise<void> {
    if (!(await this.competitionRepository.getCompetition(competitionId))) {
      throw new UnknownCompetitionError(competitionId);
    }
    await this.alertRepository.setMuted(competitionId, muted);
  }
}
