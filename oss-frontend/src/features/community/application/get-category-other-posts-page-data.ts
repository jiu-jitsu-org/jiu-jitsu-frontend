import { createGetPostListUseCase } from "@/features/community/application/community-use-case-factory";
import type { PostSummary } from "@/features/community/domain/post-summary";
import { readSessionToken } from "@/shared/lib/auth";

/** 글 상세 맨 끝에 보이는 같은 카테고리의 다른 글 수(#594). */
export const CATEGORY_OTHER_POSTS_LIMIT = 5;

/**
 * 같은 카테고리의 다른 글 — 최신 5개, 지금 글은 뺀다(#594).
 *
 * GET /board?boardListType=CATEGORY&categoryId= 의 첫 페이지(서버 기본 최신순)를 하나 더(6개) 받아 지금 글을 거른다.
 * 차단 · 숨긴 글은 서버가 이미 뺀다. 덧붙는 구역이라 못 읽으면 빈 목록 — 상세는 그대로 뜨고 구역만 숨는다.
 */
export async function getCategoryOtherPostsPageData(
  postId: number,
  categoryId: number,
): Promise<PostSummary[]> {
  const accessToken = await readSessionToken();

  try {
    const list = await createGetPostListUseCase(accessToken).execute({
      boardListType: "CATEGORY",
      categoryId,
      page: 0,
      size: CATEGORY_OTHER_POSTS_LIMIT + 1,
    });
    return list.items
      .filter((post) => post.id !== postId)
      .slice(0, CATEGORY_OTHER_POSTS_LIMIT);
  } catch {
    return [];
  }
}
