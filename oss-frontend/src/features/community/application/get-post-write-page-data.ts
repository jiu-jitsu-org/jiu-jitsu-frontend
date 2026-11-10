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
 * 카테고리는 서버 고정 분류라 거의 바뀌지 않는다 — 글쓰기 화면을 열 때마다 백엔드를 기다리면 그만큼
 * 앱 로딩이 길어진다(#389). 서버 메모리에 잠시 기억해 두고, 기한이 지나면 기억한 값을 바로 쓰며 뒤에서
 * 새로 받는다(첫 요청만 기다린다). 폴백은 기억하지 않는다 — 장애가 풀리면 바로 서버 값을 쓰게.
 */
const CATEGORY_CACHE_MS = 10 * 60 * 1000;
let cachedCategories: { value: PostCategory[]; at: number } | null = null;
let inflight: Promise<PostCategory[] | null> | null = null;

function refreshCategories(
  accessToken: string | null,
): Promise<PostCategory[] | null> {
  // 저장소를 만들다 바로 던져도(환경 값 없음 등) 폴백으로 가도록 약속 안에서 부른다.
  inflight ??= Promise.resolve()
    .then(() => createGetPostCategoriesUseCase(accessToken).execute())
    .then((categories) => {
      if (categories.length === 0) return null;
      cachedCategories = { value: categories, at: Date.now() };
      return categories;
    })
    .catch((error: unknown) => {
      console.error(
        "[community:post-write] 카테고리 조회 실패 — 폴백 사용:",
        error,
      );
      return null;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/**
 * 작성/수정 화면 Server Component용 카테고리 로드. 상세(get-post-detail-page-data)처럼 BFF를 거치지
 * 않고 application을 직접 부른다. 비로그인도 조회 가능하지만 토큰이 있으면 그대로 붙인다.
 * 실패는 로그만 남기고 폴백 목록을 돌려준다 — 화면은 항상 칩을 그릴 수 있다.
 */
export async function getPostCategoriesOrFallback(): Promise<PostCategory[]> {
  if (cachedCategories) {
    if (Date.now() - cachedCategories.at > CATEGORY_CACHE_MS) {
      void refreshCategories(await readSessionToken());
    }
    return cachedCategories.value;
  }
  const accessToken = await readSessionToken();
  return (await refreshCategories(accessToken)) ?? FALLBACK_POST_CATEGORIES;
}
