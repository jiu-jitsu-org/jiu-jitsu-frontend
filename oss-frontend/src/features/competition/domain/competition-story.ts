import type { Belt } from "@/features/community/domain/belt";

/**
 * 대회 이야기 (#366 · #597) — 커뮤니티에서 이 대회를 고르고 쓴 글.
 *
 * 서버는 최신 글을 5개까지 주고, 상세에는 그중 앞 COMPETITION_STORY_PREVIEW_COUNT개를 최신순 그대로 보여 준다
 * (글마다 아바타 · 내용 두 줄이 붙어 다섯 개면 구역이 너무 길다). 나머지는 '이 대회 이야기 모아 보기'로 본다.
 */
export type CompetitionStory = {
  postId: number;
  title: string;
  /** 내용 — 내용 없이 제목만 올린 글은 빈 문자열(#589) */
  body: string;
  /** 글쓴이 닉네임 — 없으면 빈 문자열 */
  author: string;
  /** 글쓴이 프로필 사진 — 없으면 null(기본 아바타) */
  authorAvatarUrl: string | null;
  /** 글쓴이 띠 — 안 정했으면 null(회색 점선) */
  authorBelt: Belt | null;
  /** 첫 사진 — 없으면 null */
  imageUrl: string | null;
  comments: number;
  /** 글을 올린 때 ISO 문자열 */
  createdAt: string;
};

/** 대회 상세에 보이는 이야기 수 */
export const COMPETITION_STORY_PREVIEW_COUNT = 3;

/** 대회 상세의 대회 이야기 묶음(#597) — 최신 글 몇 개와 이 대회 글 전체 수. */
export type CompetitionStoryList = {
  /** 이 대회를 고른 글 전체 수 — 홈 피드 '이 대회 글만'(#598)의 수와 같다. */
  totalCount: number;
  /** 최신순, 상세에 보일 만큼만(COMPETITION_STORY_PREVIEW_COUNT) */
  stories: CompetitionStory[];
};
