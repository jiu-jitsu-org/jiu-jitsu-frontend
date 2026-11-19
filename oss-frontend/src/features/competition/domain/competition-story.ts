/**
 * 대회 이야기 (#366 · #597) — 커뮤니티에서 이 대회를 고르고 쓴 글.
 *
 * 상세에는 최신 글 최대 5개를 서버가 준 순서(최신순) 그대로 보여 준다.
 */
export type CompetitionStory = {
  postId: number;
  title: string;
  /** 글쓴이 닉네임 — 없으면 빈 문자열 */
  author: string;
  comments: number;
  /** 글을 올린 때 ISO 문자열 */
  createdAt: string;
};

/** 대회 상세의 대회 이야기 묶음(#597) — 최신 글 몇 개와 이 대회 글 전체 수. */
export type CompetitionStoryList = {
  /** 이 대회를 고른 글 전체 수 — 홈 피드 '이 대회 글만'(#598)의 수와 같다. */
  totalCount: number;
  /** 최신순 최대 5개 */
  stories: CompetitionStory[];
};
