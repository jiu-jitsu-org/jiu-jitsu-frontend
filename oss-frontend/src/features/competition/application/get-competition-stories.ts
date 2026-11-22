import type { CompetitionRepository } from "@/features/competition/domain/competition-repository";
import {
  COMPETITION_STORY_PREVIEW_COUNT,
  type CompetitionStoryList,
} from "@/features/competition/domain/competition-story";

/** 대회 상세에 보일 '대회 이야기' — 최신순 앞 몇 개(COMPETITION_STORY_PREVIEW_COUNT)와 이 대회 글 전체 수(#366 · #597). */
export class GetCompetitionStoriesUseCase {
  constructor(private readonly competitionRepository: CompetitionRepository) {}

  async execute(competitionId: number): Promise<CompetitionStoryList> {
    const list = await this.competitionRepository.getStories(competitionId);
    return {
      ...list,
      stories: list.stories.slice(0, COMPETITION_STORY_PREVIEW_COUNT),
    };
  }
}
