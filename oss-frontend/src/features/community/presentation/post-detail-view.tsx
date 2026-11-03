import { RefreshOnLogin } from "@/features/auth/presentation/refresh-on-login";
import type { CommentList } from "@/features/community/domain/comment";
import type { CommentSort, PostDetail } from "@/features/community/domain/post";
import { BeltPromptProvider } from "@/features/community/presentation/belt-prompt";
import { CommentInputBar } from "@/features/community/presentation/comment-input-bar";
import { CommentReplyProvider } from "@/features/community/presentation/comment-reply-context";
import { CommentSection } from "@/features/community/presentation/comment-section";
import { PostActionBar } from "@/features/community/presentation/post-action-bar";
import { PostAuthorRow } from "@/features/community/presentation/post-author-row";
import { PostDetailAppBar } from "@/features/community/presentation/post-detail-app-bar";
import { PostDetailBody } from "@/features/community/presentation/post-detail-body";
import { PostDetailFooter } from "@/features/community/presentation/post-detail-footer";
import { PostDetailHeader } from "@/features/community/presentation/post-detail-header";
import { PostDetailImages } from "@/features/community/presentation/post-detail-images";
import { PostDetailReturnListener } from "@/features/community/presentation/post-detail-return-listener";
import { PostTags } from "@/features/community/presentation/post-tags";
import { KeyboardAwareShell } from "@/features/community/presentation/keyboard-aware-shell";
import { Divider } from "@/shared/ui/divider";

/**
 * 상세 화면 레이아웃 (순수 표현 서버 컴포넌트).
 *
 * 데이터 조회를 모른다 — 받은 post/comments를 배치만 한다. 덕분에 실제 화면(PostDetailScreen)과
 * mock 쇼케이스(playground)가 동일 레이아웃을 공유한다. 인터랙션 부분만 클라이언트 leaf로 분리.
 *
 * CommentReplyProvider가 전체를 감싼다 — 답글 버튼(본문 영역)과 입력 바(footer)가 트리상 형제라
 * 답글 대상을 props로 주고받을 수 없기 때문이다.
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
    <CommentReplyProvider>
      {/* 글 등록·댓글 직후 띠를 묻는 시트(#275). 방금 쓴 글이면 열자마자 확인한다. */}
      <BeltPromptProvider postId={post.id}>
        <PostDetailReturnListener postId={post.id} />
        {/* 비로그인으로 보다가 로그인하면 viewer 상태를 다시 읽는다(#173). */}
        <RefreshOnLogin />
        {/* 고정 높이 셸: 헤더(앱바)는 상단 고정, 본문+댓글만 스크롤, 댓글 입력 바는 키보드 위에 붙는다. */}
        <KeyboardAwareShell
          header={
            // 앱 웹뷰면 앱바, 외부 브라우저면 '앱 열기' 배너로 교체된다(#72).
            <PostDetailHeader
              appBar={
                <PostDetailAppBar
                  postId={post.id}
                  isOwner={post.viewer.isOwner}
                  initialNoticeEnabled={post.noticeEnabled}
                />
              }
            />
          }
          // 외부 브라우저에서는 입력 바를 감춘다(#72) — 세션이 없어 전송이 반드시 실패한다.
          footer={<PostDetailFooter inputBar={<CommentInputBar contentId={post.id} />} />}
        >
          <div>
            {/* 본문 영역: 헤더와 간격 24(pt-6), 좌우 여백 16(px-4), 섹션 간격 16(gap-4: 본문↔이미지 등, 작성자↔제목만 8) */}
            <article className="flex flex-col gap-4 px-4 pt-6">
              {/* 작성자 줄↔제목은 8(gap-2) — 홈 피드 카드와 같은 간격으로 붙여 "누가 쓴 이 글"로 묶어 읽히게 한다(#299).
                  나머지 섹션 사이(본문↔이미지 등)는 article의 16 그대로. */}
              <div className="flex flex-col gap-2">
                <PostAuthorRow
                  author={post.author}
                  isOwner={post.viewer.isOwner}
                />
                <PostDetailBody
                  title={post.title}
                  body={post.body}
                  categoryName={post.categoryName}
                  createdAt={post.createdAt}
                  views={post.views}
                  edited={post.edited}
                />
              </div>
              {post.images.length > 0 ? (
                // 이미지 규격(#121): 허용 비율 4:5~1.91:1, 벗어나면 center crop.
                // 1장은 폭 고정 + 높이 원본 비율, 여러 장은 높이 고정 + 폭 원본 비율.
                // 여러 장일 때 스크롤 영역은 이 article의 px-4를 벗어나 화면 폭까지 넓어진다.
                <PostDetailImages images={post.images} />
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
              initialSaves={post.counts.saves}
              comments={post.counts.comments}
              commented={post.viewer.commented}
            />

            {/* 액션바 아래 디바이더: 간격 24, 풀폭(좌우 여백 없음), 높이 4 */}
            <Divider className="mt-6" />

            {/* 댓글 섹션 */}
            <CommentSection
              comments={comments}
              sort={sort}
              postAuthorId={post.author.userId}
            />
          </div>
        </KeyboardAwareShell>
      </BeltPromptProvider>
    </CommentReplyProvider>
  );
}
