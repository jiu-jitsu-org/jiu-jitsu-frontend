/**
 * 대회 이야기 (#366) — 커뮤니티에서 이 대회를 고르고 쓴 글.
 *
 * 상세에는 최대 STORY_LIMIT개만 보여 준다. 반응(댓글 + 좋아요)이 있는 글 중 많은 순으로 FEATURED_STORY_COUNT개를
 * 먼저 두고, 나머지는 최신순이다. 반응이 하나도 없으면 모두 최신순이다.
 */
export type CompetitionStory = {
  postId: number;
  title: string;
  comments: number;
  likes: number;
  /** 글을 올린 때 ISO 문자열 */
  createdAt: string;
};

export const STORY_LIMIT = 5;
export const FEATURED_STORY_COUNT = 2;

export function pickCompetitionStories(
  stories: readonly CompetitionStory[],
): CompetitionStory[] {
  const latestFirst = [...stories].sort(
    // 시간대 표기가 섞여 올 수 있어("+09:00"·"Z") 글자 순서가 아니라 실제 시각으로 비교한다.
    (a, b) =>
      timeOf(b.createdAt) - timeOf(a.createdAt) || b.postId - a.postId,
  );
  const featured = latestFirst
    .filter((story) => reactionsOf(story) > 0)
    .sort((a, b) => reactionsOf(b) - reactionsOf(a))
    .slice(0, FEATURED_STORY_COUNT);
  const featuredIds = new Set(featured.map((story) => story.postId));
  const rest = latestFirst.filter((story) => !featuredIds.has(story.postId));
  return [...featured, ...rest].slice(0, STORY_LIMIT);
}

function timeOf(iso: string) {
  const time = Date.parse(iso);
  return Number.isNaN(time) ? 0 : time;
}

function reactionsOf(story: CompetitionStory) {
  return story.comments + story.likes;
}
