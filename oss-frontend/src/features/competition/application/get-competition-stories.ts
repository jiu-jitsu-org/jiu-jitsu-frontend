import type { CompetitionRepository } from "@/features/competition/domain/competition-repository";
import type { CompetitionStoryList } from "@/features/competition/domain/competition-story";

/** 대회 상세에 보일 '대회 이야기' — 최신순 최대 5개와 이 대회 글 전체 수(#366 · #597). */
export class GetCompetitionStoriesUseCase {
  constructor(private readonly competitionRepository: CompetitionRepository) {}

  execute(competitionId: number): Promise<CompetitionStoryList> {
    return this.competitionRepository.getStories(competitionId);
  }
}
