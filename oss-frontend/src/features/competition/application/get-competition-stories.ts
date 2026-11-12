import type { CompetitionRepository } from "@/features/competition/domain/competition-repository";
import type { CompetitionStory } from "@/features/competition/domain/competition-story";

/** 대회 상세에 보일 '대회 이야기' — 서버가 고른 최대 5개, 서버 순서 그대로(#366). */
export class GetCompetitionStoriesUseCase {
  constructor(private readonly competitionRepository: CompetitionRepository) {}

  execute(competitionId: number): Promise<CompetitionStory[]> {
    return this.competitionRepository.getStories(competitionId);
  }
}
