import type { ReactNode } from "react";

import { RefreshOnLogin } from "@/features/auth/presentation/refresh-on-login";
import type { Comment, CommentList } from "@/features/community/domain/comment";
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
import { WriteTimingReport } from "@/features/community/presentation/write-timing";
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
  focusedComment = null,
  sort,
  attachment,
  footerSection,
}: {
  post: PostDetail;
  comments: CommentList;
  /** 알림에서 연 댓글(#596) — 댓글 목록 맨 위에 먼저 보인다. */
  focusedComment?: Comment | null;
  sort: CommentSort;
  /** 본문(이미지) 아래·태그 위에 붙는 카드 — 글이 고른 대회(#380). */
  attachment?: ReactNode;
  /** 맨 끝(댓글 다음)에 붙는 구역 — 같은 카테고리의 다른 글(#594). */
  footerSection?: ReactNode;
}) {
  return (
    <CommentReplyProvider serverComments={comments} sort={sort}>
      {/* 글 등록·댓글 직후 띠를 묻는 시트(#275). 방금 쓴 글이면 열자마자 확인한다. */}
      <BeltPromptProvider postId={post.id}>
        <PostDetailReturnListener postId={post.id} />
        {/* 방금 등록한 글이면 상세가 그려진 시점을 남긴다(#486 측정). */}
        <WriteTimingReport postId={post.id} />
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
                  author={{
                    userId: post.author.userId,
                    nickname: post.author.nickname,
                  }}
                  initialNoticeEnabled={post.noticeEnabled}
                  commented={post.viewer.commented}
                />
              }
            />
          }
          // 외부 브라우저에서는 입력 바를 감춘다(#72) — 세션이 없어 전송이 반드시 실패한다.
          footer={
            <PostDetailFooter
              inputBar={<CommentInputBar contentId={post.id} />}
            />
          }
        >
          <>
            {/* main 바로 아래 자식이라 100%가 보이는 높이다(셸 안 스크롤 영역).
                글 + 댓글은 첫 화면 높이(100%)에서 88을 뺀 만큼은 늘 차지한다 — 짧은 글이어도 첫 화면은 글·댓글이 주인공이고,
                아래 "○○의 다른 글"은 제목과 카드 윗모서리(글자 없는 16)만 화면 끝에 걸쳐 "내리면 더 있다"만 알린다.
                88 = 띠 위 8 + 띠 4 + 구역 위 24 + 제목 24 + 카드 위 12 + 카드 윗모서리 16(안쪽 여백 18보다 작아 글자가 잘리지 않음). 긴 글이면 원래 길이 그대로. */}
            <div className="min-h-[calc(100%-88px)]">
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
                    // 상세가 처음 그려질 때 한 번만 센다 — 다시 그리기 · 피드 카드 갱신은 세지 않는다(#523).
                    viewPath={`/api/community/posts/${post.id}/views`}
                    edited={post.edited}
                  />
                </div>
                {post.images.length > 0 ? (
                  // 이미지 규격(#121): 허용 비율 4:5~1.91:1, 벗어나면 center crop.
                  // 1장은 폭 고정 + 높이 원본 비율, 여러 장은 높이 고정 + 폭 원본 비율.
                  // 여러 장일 때 스크롤 영역은 이 article의 px-4를 벗어나 화면 폭까지 넓어진다.
                  <PostDetailImages images={post.images} />
                ) : null}
                {attachment}
                {/* 본문(또는 이미지) 아래 태그 24 = article gap-4(16) + mt-2(8) */}
                <PostTags tags={post.tags} className="mt-2" />
              </article>

              {/* 액션바: 태그 아래 24(본문↔버튼 줄을 띄워 글이 숨 쉬게 — 버튼 줄↔디바이더 24와 같다), 디바이더 없음, 우측 정렬 */}
              <PostActionBar
                className="mt-6"
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
                contentId={post.id}
                comments={comments}
                focusedComment={focusedComment}
                sort={sort}
                postAuthorId={post.author.userId}
              />
            </div>

            {footerSection}
          </>
        </KeyboardAwareShell>
      </BeltPromptProvider>
    </CommentReplyProvider>
  );
}
