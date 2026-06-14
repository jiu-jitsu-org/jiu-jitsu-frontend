import type { CommentList } from "@/features/community/domain/comment";
import type { CommentSort, PostDetail } from "@/features/community/domain/post";
import { CommentInputBar } from "@/features/community/presentation/comment-input-bar";
import { CommentSection } from "@/features/community/presentation/comment-section";
import { PostActionBar } from "@/features/community/presentation/post-action-bar";
import { PostAuthorRow } from "@/features/community/presentation/post-author-row";
import { PostDetailAppBar } from "@/features/community/presentation/post-detail-app-bar";
import { PostDetailBody } from "@/features/community/presentation/post-detail-body";
import { PostTags } from "@/features/community/presentation/post-tags";
import { FeedCardImages, KeyboardAwareShell } from "@/shared/ui";

/**
 * 상세 화면 레이아웃 (순수 표현 서버 컴포넌트).
 *
 * 데이터 조회를 모른다 — 받은 post/comments를 배치만 한다. 덕분에 실제 화면(PostDetailScreen)과
 * mock 쇼케이스(playground)가 동일 레이아웃을 공유한다. 인터랙션 부분만 클라이언트 leaf로 분리.
 */
export function PostDetailView({
  post,
  comments,
  sort,
}: {
  post: PostDetail;
  comments: CommentList;
  sort: CommentSort;
}) {
  return (
    // 고정 높이 셸: 헤더(앱바)는 상단 고정, 본문+댓글만 스크롤, 댓글 입력 바는 키보드 위에 붙는다.
    <KeyboardAwareShell
      header={
        <PostDetailAppBar
          postId={post.id}
          isOwner={post.viewer.isOwner}
          initialNoticeEnabled={post.noticeEnabled}
        />
      }
      footer={<CommentInputBar postId={post.id} />}
    >
      <div>
        {/* 본문 영역: 헤더와 간격 24(pt-6), 좌우 여백 16(px-4), 섹션 간격 16(gap-4: 프로필 row↔제목 row 등) */}
        <article className="flex flex-col gap-4 px-4 pt-6">
          <PostAuthorRow author={post.author} />
          <PostDetailBody
            title={post.title}
            body={post.body}
            createdAt={post.createdAt}
            views={post.views}
            edited={post.edited}
          />
          {post.images.length > 0 ? (
            <FeedCardImages
              images={post.images.map((image) => ({ url: image.imageUrl }))}
            />
          ) : null}
          {/* 본문(또는 이미지) 아래 태그 24 = article gap-4(16) + mt-2(8) */}
          <PostTags tags={post.tags} className="mt-2" />
        </article>

        {/* 액션바: 태그 아래 13, 디바이더 없음, 우측 정렬 */}
        <PostActionBar
          className="mt-[13px]"
          postId={post.id}
          initialLiked={post.viewer.liked}
          initialBookmarked={post.viewer.bookmarked}
          initialLikes={post.counts.likes}
        />

        {/* 액션바 아래 디바이더: 간격 22, 풀폭(좌우 여백 없음), 높이 4, #F7F7F7(토큰 미매핑 특수 케이스) */}
        <div className="mt-[22px] h-1 bg-[#F7F7F7]" />

        {/* 댓글 섹션 */}
        <CommentSection comments={comments} sort={sort} />
      </div>
    </KeyboardAwareShell>
  );
}
