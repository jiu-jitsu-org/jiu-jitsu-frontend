import type { PostSummary } from "@/features/community/domain/post-summary";
import { getPostCompetitionCards } from "@/features/competition/application/get-post-competition-cards";
import { readServerNow } from "@/shared/lib/time";

/**
 * 피드 글마다 고른 대회 카드를 붙인다(#379). 대회를 고르지 않은 글은 그대로다.
 *
 * 글 목록 API가 고른 대회를 실어 주면 이 단계는 지운다 — 첫 페이지(Server Component)와 다음 페이지(BFF)가 함께 쓴다.
 */
export async function attachPostCompetitions(
  items: PostSummary[],
  signedIn: boolean,
): Promise<PostSummary[]> {
  const cards = await getPostCompetitionCards({
    postIds: items.map((post) => post.id),
    now: readServerNow(),
    signedIn,
  });
  if (Object.keys(cards).length === 0) return items;
  return items.map((post) =>
    cards[post.id] ? { ...post, competition: cards[post.id] } : post,
  );
}
