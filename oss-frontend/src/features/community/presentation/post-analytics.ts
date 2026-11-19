import type { PostCategory } from "@/features/community/domain/post";

/**
 * 글 · 댓글 기록(GA, #619)의 꼬리표 값 — 글쓰기 · 수정이 같이 쓴다. 원문(제목 · 본문 · 태그 이름)은 싣지 않는다.
 */

/**
 * 카테고리 이름 → 사전 `category` 값. 서버 id는 DB마다 달라(빈 DB는 이름으로 만들고 기존 DB는 SQL로 맞춤)
 * 이름으로 맞춘다. 모르는 이름은 `cat_{id}`.
 */
const CATEGORY_VALUES: Record<string, string> = {
  "도장 · 오픈매트": "gym_openmat",
  대회: "competition",
  "훈련 & 기술": "training",
  "도복 · 장비": "gear",
  "몸관리 · 부상": "health",
  "매트 위 수다": "mat_talk",
};

export function categoryParam(
  category: Pick<PostCategory, "id" | "name"> | undefined,
): string | undefined {
  if (!category) return undefined;
  return CATEGORY_VALUES[category.name] ?? `cat_${category.id}`;
}

/** 본문 길이 구간(사전 `body_len`) — 0(제목만) · 1-50 · 51-200 · 201-500 · 501+. */
export function bodyLengthBucket(body: string): string {
  const length = body.trim().length;
  if (length === 0) return "0";
  if (length <= 50) return "1-50";
  if (length <= 200) return "51-200";
  if (length <= 500) return "201-500";
  return "501+";
}
