"use client";

import type { Comment } from "@/features/community/domain/comment";
import type { CommentSort } from "@/features/community/domain/post";
import { Avatar } from "@/features/community/presentation/avatar";
import { BeltAvatar } from "@/features/community/presentation/belt-avatar";
import { CoachBadge } from "@/features/community/presentation/coach-badge";
import { CommentLikeButton } from "@/features/community/presentation/comment-like-button";
import { splitMentions } from "@/features/community/presentation/comment-mention";
import { CommentReplyButton } from "@/features/community/presentation/comment-reply-button";
import { CommentMenu } from "@/features/community/presentation/comment-menu";
import { CommentPlaceholder } from "@/features/community/presentation/comment-placeholder";
import { CommentReplies } from "@/features/community/presentation/comment-replies";
import { useCommentReply } from "@/features/community/presentation/comment-reply-context";
import { useArriveMotion } from "@/features/community/presentation/use-arrive-motion";
import { AuthorProfileLink } from "@/features/community/presentation/author-profile-link";
import { cn } from "@/shared/lib/cn";
import { ReplyBranchIcon } from "@/shared/ui/icons";
import { RelativeTime } from "@/shared/ui/relative-time";

/**
 * 단일 댓글 행 (클라이언트 컴포넌트, 초안).
 *
 * 구성: (대댓글이면 분기 아이콘 +) 아바타 + 닉네임(+"작성자" 배지) + 날짜 / 본문 / 반응 행.
 *
 * WHY 클라이언트인가: 「대댓글 더보기」로 불러오는 대댓글은 브라우저에서 렌더해야 한다(#62).
 * 서버 렌더 전용으로 두면 미리보기용/추가 로드용 댓글 행을 두 벌 만들게 되고, 그 순간부터
 * 같은 줄인데 다르게 보이기 시작한다. 서버 전용 의존이 없고 자식(좋아요·답글·⋮)은 이미
 * 전부 클라이언트 leaf라 옮기는 비용은 상세 초기 번들 증가뿐이다.
 *
 * FIXME(초안): 반응 토글·답글·⋮ 메뉴 동작과 정확한 디자인 토큰/간격은 가이드 확정 후 적용.
 */
export function CommentItem({
  comment,
  sort,
  postAuthorId,
  isReply = false,
  threadId,
}: {
  comment: Comment;
  /** 대댓글 추가 조회에 그대로 넘길 정렬 — 목록과 어긋나면 중복·누락이 생긴다. */
  sort: CommentSort;
  /** 게시글 작성자 id — 추가 로드된 대댓글의 "작성자" 배지 판정용(CommentReplies로 전달). */
  postAuthorId?: number | null;
  /** 대댓글이면 아바타 앞에 분기 아이콘을 붙인다. */
  isReply?: boolean;
  /** 대댓글이 속한 최상위 댓글 id — 대댓글의 답글 버튼이 이 스레드 끝에 답글을 붙인다(#451). */
  threadId?: number;
}) {
  // 대댓글 렌더는 원문·placeholder가 공유한다 — 부모가 가려져도 스레드는 유지되기 때문.
  // 미리보기가 비어도 총 개수가 있으면 그려야 한다 — 「대댓글 더보기」가 유일한 접근 경로다.
  const replies =
    comment.replies.length > 0 || comment.replyCount > 0 ? (
      <CommentReplies
        parentId={comment.id}
        sort={sort}
        totalCount={comment.replyCount}
        replies={comment.replies}
        postAuthorId={postAuthorId}
      />
    ) : null;

  // 방금 등록한 댓글이면 펼쳐지며 반짝인다(아래 li에 건다 — 가린 댓글 자리표시에는 걸지 않는다).
  const { justPostedId } = useCommentReply();
  const arriveRef = useArriveMotion<HTMLLIElement>(comment.id === justPostedId);

  // 삭제된 댓글은 목록에서 빼지 않고 자리 표시만 남긴다 — 대댓글(children)은 그대로 노출된다.
  // 신고보다 먼저 본다: 신고해 둔 댓글이 뒤이어 삭제됐다면 최종 상태는 삭제다.
  // 되돌리기(복구)는 삭제를 띄운 ⋮ 메뉴 토스트가 쥔다(#370) — 자리 표시 자체에는 버튼을 두지 않는다.
  if (comment.isDeleted) {
    return (
      <CommentPlaceholder message="삭제한 댓글입니다." isReply={isReply}>
        {replies}
      </CommentPlaceholder>
    );
  }

  // 차단한 회원의 댓글도 자리 표시만 남긴다(차단한 본인 화면 한정 · #53).
  // 신고보다 먼저 본다: 차단은 작성자 단위라 그 회원의 댓글 전체에 걸리는 넓은 상태고,
  // 서버가 본문·작성자를 마스킹해 내려주므로 신고 문구로 그릴 원문 자체가 없다.
  if (comment.isBlocked) {
    return (
      <CommentPlaceholder message="차단한 댓글입니다." isReply={isReply}>
        {replies}
      </CommentPlaceholder>
    );
  }

  // 내가 신고한 댓글은 본문 대신 자리 표시만 남긴다(신고자 본인 화면 한정).
  if (comment.isReported) {
    return (
      <CommentPlaceholder message="신고된 댓글입니다." isReply={isReply}>
        {replies}
      </CommentPlaceholder>
    );
  }

  return (
    // 아바타↔콘텐츠 간격 4(gap-1). 아바타는 프로필 행(닉네임/날짜)과 수직 가운데 정렬.
    // 세로 패딩 없음 — 댓글 사이 간격은 목록(묶음 사이 24)·대댓글 묶음(묶음 안 8)이 담당.
    //
    // 대댓글: -ml-7(28)로 왼쪽 28을 되찾아 분기 아이콘(24) + gap 4 = 28을 그 자리에 채운다.
    // 결과적으로 아바타·본문의 최종 x는 아이콘이 없을 때와 동일하다(들여쓰기 변화 없음).
    <li ref={arriveRef} className={cn("flex gap-1", isReply && "-ml-7")}>
      {isReply ? (
        // 위에서 내려와 오른쪽으로 꺾이는 연결선 — 이 행이 위 댓글의 대댓글임을 나타낸다.
        // 띠 아바타(32)라 4 내려 꺾이는 끝(아이콘 가운데 12)을 아바타 가운데(16)에 맞춘다.
        <ReplyBranchIcon
          size={24}
          className="mt-1 shrink-0 self-start text-comment-thread-line-stroke"
        />
      ) : null}
      {/* 홈 피드 카드와 같이 사진 24 + 띠 = 32로 그린다(#265·#299, 띠가 없으면 회색 점선). 프로필 행·분기 아이콘도 이 높이에 맞춘다.
          로드 실패 시 기본 상태 폴백.
          아바타·닉네임을 누르면 작성자 프로필을 연다(앱에서 내 댓글은 MY 탭) — 둘이 떨어져 있어 각각 감싸고,
          아바타는 닉네임과 같은 동작이라 탭 순서·스크린리더에서는 뺀다(decorative). */}
      <AuthorProfileLink
        userId={comment.author.userId}
        isOwner={comment.isOwner}
        decorative
        className="flex shrink-0 self-start"
      >
        <BeltAvatar belt={comment.author.belt ?? null} size="card">
          <Avatar src={comment.author.avatarUrl} className="size-full" iconSize={16} />
        </BeltAvatar>
      </AuthorProfileLink>
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 프로필 행: 높이를 띠 아바타와 같게(32) 두고 items-center → 아이콘 기준 수직 가운데.
            닉네임↔날짜 간격 6(gap-1.5). */}
        <div className="flex h-8 items-center gap-1.5">
          {/* 닉네임: Body S(14) — 홈 카드 닉네임과 같은 크기(#299), 본문(14)과 같은 크기라도 Medium·진한 색으로 앞선다.
              text/text-primary — 피드 카드 닉네임(회색)과 달리 댓글에선 이름이 첫 단서라 진하게 둔다.
              관장·사범이면 배지를 닉네임에 붙여 둔다(#272, 간격 2) — 작성자 배지와는 기존 간격 6으로 떨어진다. */}
          <AuthorProfileLink
            userId={comment.author.userId}
            isOwner={comment.isOwner}
            className="flex items-center gap-0.5"
          >
            <span className="text-body-s text-text-primary">
              {comment.author.nickname}
            </span>
            {comment.author.isCoach ? <CoachBadge /> : null}
          </AuthorProfileLink>
          {comment.isPostAuthor ? (
            // 작성자 배지: comment-author-badge 토큰, radius 4, 패딩 좌우4·상하2, Label M
            <span className="rounded bg-comment-author-badge-bg px-1 py-0.5 text-label-m text-comment-author-badge-text">
              작성자
            </span>
          ) : null}
          {/* 날짜: Label M, feed-card/header/date-text. 댓글·대댓글은 상대 시간 고정(정책 2). */}
          <RelativeTime
            iso={comment.createdAt}
            className="text-label-m text-feed-card-header-date-text"
          />
        </div>
        {/* 본문: 프로필 행과 간격 2, 닉네임 좌측 정렬(컬럼 기준), n줄 전부 노출(클램프 없음).
            프로필 행(32) 안에서 닉네임 글줄(21) 아래로 이미 5.5가 비어 있어, 2를 더하면 글줄 사이가 7.5 —
            프로필 행이 24일 때(간격 7)처럼 닉네임과 본문이 붙어 읽힌다(#299).
            Body S(14/21), feed-card/body/body-text */}
        <p className="mt-0.5 whitespace-pre-wrap text-body-s text-feed-card-body-text">
          {/* `@닉네임` 태그(#451)는 같은 글자 크기에 파란 글씨로만 구분한다 — 면·밑줄 없이. */}
          {splitMentions(comment.body).map((part, index) =>
            part.mention ? (
              <span key={index} className="text-interactive-primary">
                {part.text}
              </span>
            ) : (
              part.text
            ),
          )}
        </p>

        {/* 본문 바로 하단 반응 행(본문과 간격 0): 답글 · 좋아요(+카운트) — 왼쪽, ⋮ — 오른쪽 끝.
            높이 28 고정. 버튼 사이 간격 4(gap-1).
            답글·좋아요를 본문 바로 아래 왼쪽에 붙여 "이 댓글의 버튼"으로 읽히게 한다(#258) —
            오른쪽 끝에 몰려 있으면 눈이 반대편까지 가야 하고 다음 댓글에 더 가까워 보인다.
            -ml-2: 버튼 좌우 패딩(8)만큼 당겨 첫 아이콘 시작을 본문 왼쪽 끝에 맞춘다.
            ⋮는 자주 쓰지 않는 보조 동작이라 오른쪽 끝에 남긴다.
            색/상태는 comment-reaction-styles가 단일 출처. */}
        <div className="-ml-2 flex h-7 items-center justify-between">
          <div className="flex items-center gap-1">
            {/* 대댓글에도 답글 버튼을 둔다(#451) — 대댓글 아래로 또 들여 쓰지 않고(2단 유지)
                같은 최상위 스레드 끝에 붙이되, 칩·`@태그`는 누른 대댓글의 작성자를 가리킨다.
                대댓글의 replyCount·replied는 자기 자식 기준이라 늘 0·false — "댓글쓰기"로 보인다.
                내 대댓글에 이어 쓸 땐 나를 태그하지 않는다. 닉네임이 비어 오면(DTO 폴백) "@ "만 들어가니 넣지 않는다. */}
            {isReply ? (
              threadId !== undefined ? (
                <CommentReplyButton
                  parentId={threadId}
                  nickname={comment.author.nickname}
                  replyCount={0}
                  replied={false}
                  mention={!comment.isOwner && comment.author.nickname !== ""}
                />
              ) : null
            ) : (
              <CommentReplyButton
                parentId={comment.id}
                nickname={comment.author.nickname}
                replyCount={comment.replyCount}
                replied={comment.replied}
              />
            )}
            <CommentLikeButton
              commentId={comment.id}
              initialLiked={comment.liked}
              initialLikeCount={comment.likeCount}
            />
          </div>
          {/* ⋮ 메뉴: 내 댓글=삭제 / 타인 댓글=차단·신고. 차단 시 닉네임으로 확인 알럿 */}
          <CommentMenu
            commentId={comment.id}
            authorId={comment.author.userId}
            isOwner={comment.isOwner}
            authorNickname={comment.author.nickname}
          />
        </div>

        {/* 대댓글: 같은 댓글 폼을 들여쓰기로 재사용(콘텐츠 컬럼 안에 두어 부모 닉네임 기준 정렬).
            서버가 준 미리보기 3개를 그리고, 더 있으면 「대댓글 더보기」로 10개씩 이어 받는다. */}
        {replies}
      </div>
    </li>
  );
}
