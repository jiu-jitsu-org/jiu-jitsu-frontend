/**
 * 대회 이야기 (#366) — 커뮤니티에서 이 대회를 고르고 쓴 글.
 *
 * 상세에는 서버가 고른 최대 5개를 서버가 준 순서 그대로 보여 준다.
 */
export type CompetitionStory = {
  postId: number;
  title: string;
  comments: number;
  likes: number;
  /** 글을 올린 때 ISO 문자열 */
  createdAt: string;
};
