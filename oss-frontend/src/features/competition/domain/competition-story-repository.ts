import type { CompetitionStory } from "@/features/competition/domain/competition-story";

/**
 * 대회별 커뮤니티 글 (#366 · #367).
 *
 * 글은 커뮤니티가 갖고, 이 저장소는 "어느 글이 어느 대회를 골랐나"만 안다.
 */
export interface CompetitionStoryRepository {
  /** 이 대회를 고른 글 전부(순서 없음). 상세가 고르고 줄 세운다. */
  getStories(competitionId: string): Promise<CompetitionStory[]>;
  /** 글이 고른 대회를 정한다. competitionId가 null이면 연결을 지운다(글 수정에서 대회를 뺐을 때). */
  setPostCompetition(
    post: Omit<CompetitionStory, "comments" | "likes">,
    competitionId: string | null,
  ): Promise<void>;
  /** 글이 고른 대회 id — 글 수정 화면이 처음 값으로 쓴다. 없으면 null. */
  getPostCompetitionId(postId: number): Promise<string | null>;
}
