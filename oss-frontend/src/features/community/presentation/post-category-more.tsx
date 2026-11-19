import { getCategoryOtherPostsPageData } from "@/features/community/application/get-category-other-posts-page-data";
import { PostCategoryMoreList } from "@/features/community/presentation/post-category-more-list";

/**
 * 글 상세 맨 끝(댓글 다음) "○○의 다른 글"(#594) — 서버 컴포넌트.
 *
 * 알림 · 검색으로 글에 바로 들어온 사람이 다 읽은 뒤 갈 곳을 둔다. 상세 본문을 기다리게 하지 않도록
 * 호출부가 Suspense로 감싸 따로 흘려보낸다(본문 · 댓글이 먼저 그려진다).
 * 다른 글이 없거나 못 읽으면 구역째 그리지 않는다.
 */
export async function PostCategoryMore({
  postId,
  categoryId,
  categoryName,
}: {
  postId: number;
  categoryId: number;
  categoryName: string;
}) {
  const posts = await getCategoryOtherPostsPageData(postId, categoryId);
  if (posts.length === 0) return null;

  return (
    <PostCategoryMoreList
      title={`${categoryName}의 다른 글`}
      posts={posts.map((post) => ({
        id: post.id,
        title: post.title,
        comments: post.counts.comments,
        createdAt: post.createdAt,
      }))}
    />
  );
}
