import { getPostCategoriesOrFallback } from "@/features/community/application/get-post-write-page-data";
import { PostWriteScreen } from "@/features/community/presentation/post-write-screen";

/**
 * 게시글 작성 라우트 (얇은 엔트리).
 *
 * 카테고리 칩 목록만 서버에서 읽어 넘기고(실패 시 폴백), 나머지는 전 영역이 인터랙티브한
 * 클라이언트 화면(PostWriteScreen)에 위임한다.
 */
export default async function CommunityWritePage() {
  const categories = await getPostCategoriesOrFallback();
  return <PostWriteScreen categories={categories} />;
}
