import type { CompetitionRepository } from "@/features/competition/domain/competition-repository";
import type { CompetitionStoryRepository } from "@/features/competition/domain/competition-story-repository";
import { UnknownCompetitionError } from "@/features/competition/application/set-competition-interest";

/**
 * 글이 고른 대회를 저장한다(#367). competitionId가 null이면 연결을 지운다.
 * 글 저장 API가 대회를 받게 되면 글 저장과 한 번에 보내고 이 유스케이스는 지운다.
 */
export class LinkPostCompetitionUseCase {
  constructor(
    private readonly competitionRepository: CompetitionRepository,
    private readonly storyRepository: CompetitionStoryRepository,
  ) {}

  async execute(
    post: { postId: number; title: string; createdAt: string },
    competitionId: string | null,
  ): Promise<void> {
    if (
      competitionId !== null &&
      !(await this.competitionRepository.getCompetition(competitionId))
    ) {
      throw new UnknownCompetitionError(competitionId);
    }
    await this.storyRepository.setPostCompetition(post, competitionId);
  }
}

/** 글이 고른 대회 id(#367) — 글 수정 화면의 처음 값. */
export class GetPostCompetitionIdUseCase {
  constructor(private readonly storyRepository: CompetitionStoryRepository) {}

  async execute(postId: number): Promise<string | null> {
    return this.storyRepository.getPostCompetitionId(postId);
  }
}
