import type { CompetitionStory } from "@/features/competition/domain/competition-story";
import type { CompetitionStoryRepository } from "@/features/competition/domain/competition-story-repository";

/**
 * 대회별 글 API가 나오기 전까지 쓰는 저장소 (#366 · #367).
 *
 * 처음에는 예시 글 몇 개를 깔아 둔다 — 반응 많은 글 먼저 · 최신순 · 글 없음이 모두 보이게. 예시 글의 postId는
 * 실제 글이 아니라 누르면 "없는 글" 화면이 뜬다.
 * 글쓰기에서 대회를 고르면 실제 글이 여기에 연결된다(서버 메모리 — 다시 켜면 예시만 남는다). 연결된 실제 글의
 * 댓글·좋아요 수는 API가 나오면 함께 내려온다 — 지금은 0으로 둔다.
 */
const SAMPLE_STORIES: Record<string, CompetitionStory[]> = {
  "seoul-open-championship": [
    story(900101, "-76kg 몇 명이나 나올까요?", 12, 8, "2026-11-06T10:00:00+09:00"),
    story(900102, "작년에 나가신 분, 대기 시간 어땠나요?", 9, 5, "2026-11-05T21:10:00+09:00"),
    story(900103, "첫 대회 계체, 도복 입고 재나요?", 1, 0, "2026-11-08T09:40:00+09:00"),
    story(900104, "도장에서 저 혼자 나가요. 같이 몸 풀 분?", 2, 0, "2026-11-08T07:00:00+09:00"),
    story(900105, "주차 어디에 하세요?", 1, 0, "2026-11-07T19:30:00+09:00"),
    story(900106, "체급 하나 올릴지 고민이에요", 0, 0, "2026-11-01T12:00:00+09:00"),
  ],
  "gwangju-championship": [
    story(900201, "첫 대회 끝! 블루 -76kg 은메달 후기", 14, 22, "2026-11-07T20:00:00+09:00"),
    story(900202, "오늘 대기 시간 어땠나요?", 9, 0, "2026-11-07T18:00:00+09:00"),
  ],
  "daejeon-open": [
    story(900301, "대전 오픈 노기 부문 처음 나가요", 0, 0, "2026-11-04T08:00:00+09:00"),
    story(900302, "대전역에서 경기장까지 버스 있나요?", 0, 0, "2026-11-06T13:00:00+09:00"),
  ],
};

function story(
  postId: number,
  title: string,
  comments: number,
  likes: number,
  createdAt: string,
): CompetitionStory {
  return { postId, title, comments, likes, createdAt };
}

type Linked = Omit<CompetitionStory, "comments" | "likes"> & {
  competitionId: string;
};

const STORE_KEY = Symbol.for("oss.fixture.competition-stories");

/** 서버 메모리가 한없이 늘지 않게 연결은 이만큼만 둔다 — 넘으면 가장 먼저 연결한 글부터 뺀다. */
const MAX_LINKED_POSTS = 500;

/** 글 id → 연결. 글 하나는 대회 하나만 고른다. */
function linkedPosts(): Map<number, Linked> {
  const scope = globalThis as typeof globalThis & {
    [STORE_KEY]?: Map<number, Linked>;
  };
  scope[STORE_KEY] ??= new Map();
  return scope[STORE_KEY];
}

export class FixtureCompetitionStoryRepository
  implements CompetitionStoryRepository
{
  async getStories(competitionId: string): Promise<CompetitionStory[]> {
    const linked = [...linkedPosts().values()]
      .filter((post) => post.competitionId === competitionId)
      .map(({ postId, title, createdAt }) => ({
        postId,
        title,
        createdAt,
        comments: 0,
        likes: 0,
      }));
    return [...(SAMPLE_STORIES[competitionId] ?? []), ...linked];
  }

  async setPostCompetition(
    post: Omit<CompetitionStory, "comments" | "likes">,
    competitionId: string | null,
  ): Promise<void> {
    const posts = linkedPosts();
    if (competitionId === null) {
      posts.delete(post.postId);
      return;
    }
    // 글 수정으로 다시 저장해도 처음 올린 때를 지킨다 — 최신순이 수정할 때마다 바뀌지 않게.
    const createdAt = posts.get(post.postId)?.createdAt ?? post.createdAt;
    posts.delete(post.postId);
    posts.set(post.postId, { ...post, createdAt, competitionId });
    if (posts.size > MAX_LINKED_POSTS) {
      const oldest = posts.keys().next().value;
      if (oldest !== undefined) posts.delete(oldest);
    }
  }

  async getPostCompetitionId(postId: number): Promise<string | null> {
    return linkedPosts().get(postId)?.competitionId ?? null;
  }
}
