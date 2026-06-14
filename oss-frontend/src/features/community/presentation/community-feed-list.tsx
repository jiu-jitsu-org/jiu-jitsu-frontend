"use client";

import { useOpenPostDetail } from "@/features/community/presentation/use-open-post-detail";
import { usePostActions } from "@/features/community/presentation/use-post-actions";
import type { PostSummary } from "@/features/community/domain/post-summary";
import { FeedCard, FeedListEnd } from "@/shared/ui";

/**
 * 커뮤니티 메인 피드 목록.
 *
 * community-playground의 FeedCard 쇼케이스를 그대로 재현하되, 데모용 useState 대신
 * 서버에서 받은 실제 게시글(PostSummary)을 렌더링한다.
 * 카드 양옆 마진 16(카드 자체 px-4), 카드 사이 간격 16 — 쇼케이스와 동일.
 *
 * 마지막 페이지면 끝 표식(FeedListEnd)을 노출한다. (페이지네이션/무한스크롤은 후속)
 */
export function CommunityFeedList({
  posts,
  isLast,
}: {
  posts: PostSummary[];
  isLast: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 py-4">
      {posts.map((post) => (
        <FeedCardItem key={post.id} post={post} />
      ))}
      {isLast ? <FeedListEnd /> : null}
    </div>
  );
}

/**
 * 단일 게시글 카드.
 *
 * 좋아요/저장은 서버 초기 상태(viewer)를 시드로 usePostActions가 낙관적 토글 + BFF 요청을 담당한다
 * (상세 화면과 동일 훅 재사용). 카드 탭/댓글 탭 → 상세 열기(네이티브면 서브뷰, 웹이면 라우터 이동).
 *
 * 저장(북마크) 카운트는 응답에 없어 0으로 둔다 → FeedCard가 숫자를 숨기고 아이콘만 표시한다.
 */
function FeedCardItem({ post }: { post: PostSummary }) {
  const openPostDetail = useOpenPostDetail();
  const { liked, bookmarked, likes, toggleLike, toggleBookmark } =
    usePostActions(post.id, {
      liked: post.viewer.liked,
      bookmarked: post.viewer.bookmarked,
      likes: post.counts.likes,
    });

  return (
    <FeedCard
      author={{
        name: post.author.nickname,
        avatarUrl: post.author.avatarUrl ?? undefined,
      }}
      createdAt={post.createdAt}
      title={post.title}
      body={post.body}
      images={post.images.map((image) => ({ url: image.imageUrl, alt: "" }))}
      counts={{ comments: post.counts.comments, likes, bookmarks: 0 }}
      commented={post.viewer.commented}
      liked={liked}
      bookmarked={bookmarked}
      onPress={() => openPostDetail(post.id)}
      onPressComment={() => openPostDetail(post.id)}
      onToggleLike={toggleLike}
      onToggleBookmark={toggleBookmark}
    />
  );
}
