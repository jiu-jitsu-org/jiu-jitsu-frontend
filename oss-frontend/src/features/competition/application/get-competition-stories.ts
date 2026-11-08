import {
  pickCompetitionStories,
  type CompetitionStory,
} from "@/features/competition/domain/competition-story";
import type { CompetitionStoryRepository } from "@/features/competition/domain/competition-story-repository";

/** 대회 상세에 보일 '대회 이야기' — 최대 5개, 반응 많은 글 먼저(#366). */
export class GetCompetitionStoriesUseCase {
  constructor(private readonly storyRepository: CompetitionStoryRepository) {}

  async execute(competitionId: string): Promise<CompetitionStory[]> {
    return pickCompetitionStories(
      await this.storyRepository.getStories(competitionId),
    );
  }
}
