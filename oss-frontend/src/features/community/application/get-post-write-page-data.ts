import { createGetPostCategoriesUseCase } from "@/features/community/application/community-use-case-factory";
import type { PostCategory } from "@/features/community/domain/post";
import { readSessionToken } from "@/shared/lib/auth";

/**
 * 카테고리 API가 실패했을 때의 폴백 — 서버 응답(2026-09-16 Swagger)과 같은 값.
 *
 * WHY 폴백이 있는가: 카테고리 조회가 잠깐 죽었다고 글쓰기 자체가 막히면 손해가 더 크다. id는 서버 고정
 * 분류라 폴백으로 등록해도 POST /board가 받아들인다. 카테고리가 바뀌면 서버가 정본이고 이 목록은
 * 장애 시에만 보인다.
 */
const FALLBACK_POST_CATEGORIES: PostCategory[] = [
  { id: 1, name: "매트 위 수다" },
  { id: 2, name: "훈련 & 기술" },
  { id: 3, name: "도장" },
  { id: 4, name: "장비" },
  { id: 5, name: "대회" },
];

/**
 * 작성/수정 화면 Server Component용 카테고리 로드. 상세(get-post-detail-page-data)처럼 BFF를 거치지
 * 않고 application을 직접 부른다. 비로그인도 조회 가능하지만 토큰이 있으면 그대로 붙인다.
 * 실패는 로그만 남기고 폴백 목록을 돌려준다 — 화면은 항상 칩을 그릴 수 있다.
 */
export async function getPostCategoriesOrFallback(): Promise<PostCategory[]> {
  const accessToken = await readSessionToken();
  try {
    const categories =
      await createGetPostCategoriesUseCase(accessToken).execute();
    return categories.length > 0 ? categories : FALLBACK_POST_CATEGORIES;
  } catch (error) {
    console.error(
      "[community:post-write] 카테고리 조회 실패 — 폴백 사용:",
      error,
    );
    return FALLBACK_POST_CATEGORIES;
  }
}
