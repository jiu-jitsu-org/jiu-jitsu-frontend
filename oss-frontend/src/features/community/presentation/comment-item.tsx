"use client";

import type { Comment } from "@/features/community/domain/comment";
import type { CommentSort } from "@/features/community/domain/post";
import { Avatar } from "@/features/community/presentation/avatar";
import { CommentLikeButton } from "@/features/community/presentation/comment-like-button";
import { CommentReplyButton } from "@/features/community/presentation/comment-reply-button";
import { CommentMenu } from "@/features/community/presentation/comment-menu";
import { CommentPlaceholder } from "@/features/community/presentation/comment-placeholder";
import { CommentReplies } from "@/features/community/presentation/comment-replies";
import { cn } from "@/shared/lib/cn";
import { ReplyBranchIcon } from "@/shared/ui/icons";

/** 서버 timeAgo가 없을 때만 쓰는 폴백. ISO → "M월 D일". 파싱 실패 시 원문 반환. */
function formatCommentDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

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
}: {
  comment: Comment;
  /** 대댓글 추가 조회에 그대로 넘길 정렬 — 목록과 어긋나면 중복·누락이 생긴다. */
  sort: CommentSort;
  /** 게시글 작성자 id — 추가 로드된 대댓글의 "작성자" 배지 판정용(CommentReplies로 전달). */
  postAuthorId?: number | null;
  /** 대댓글이면 아바타 앞에 분기 아이콘을 붙이고, 답글 버튼을 감춘다. */
  isReply?: boolean;
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

  // 삭제된 댓글은 목록에서 빼지 않고 자리 표시만 남긴다 — 대댓글(children)은 그대로 노출된다.
  // 신고보다 먼저 본다: 신고해 둔 댓글이 뒤이어 삭제됐다면 최종 상태는 삭제다.
  // FIXME(#61 후속): 되돌리기(복구)는 복구 API(backend#112) 선행이라 이번 범위에서 제외.
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
    // 세로 패딩 없음 — 댓글 사이 간격(12)은 목록(ul gap-3)이 담당.
    //
    // 대댓글: -ml-7(28)로 왼쪽 28을 되찾아 분기 아이콘(24) + gap 4 = 28을 그 자리에 채운다.
    // 결과적으로 아바타·본문의 최종 x는 아이콘이 없을 때와 동일하다(들여쓰기 변화 없음).
    <li className={cn("flex gap-1", isReply && "-ml-7")}>
      {isReply ? (
        // 위에서 내려와 오른쪽으로 꺾이는 연결선 — 이 행이 위 댓글의 대댓글임을 나타낸다.
        <ReplyBranchIcon
          size={24}
          className="shrink-0 self-start text-comment-thread-line-stroke"
        />
      ) : null}
      {/* 프로필 아이콘 24x24, 로드 실패 시 기본 상태 폴백 */}
      <Avatar src={comment.author.avatarUrl} className="size-6" iconSize={16} />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 프로필 행: 높이 24(아바타와 동일)로 두고 items-center → 아이콘 기준 수직 가운데.
            닉네임↔날짜 간격 6(gap-1.5). */}
        <div className="flex h-6 items-center gap-1.5">
          {/* 닉네임: Body M, feed-card/header/username-text */}
          <span className="text-body-m text-feed-card-header-username-text">
            {comment.author.nickname}
          </span>
          {comment.isPostAuthor ? (
            // 작성자 배지: comment-author-badge 토큰, radius 4, 패딩 좌우4·상하2, Label M
            <span className="rounded bg-comment-author-badge-bg px-1 py-0.5 text-label-m text-comment-author-badge-text">
              작성자
            </span>
          ) : null}
          {/* 날짜: Label M, feed-card/header/date-text */}
          <time
            dateTime={comment.createdAt}
            className="text-label-m text-feed-card-header-date-text"
          >
            {comment.timeAgo ?? formatCommentDate(comment.createdAt)}
          </time>
        </div>
        {/* 본문: 프로필 행과 간격 7, 닉네임 좌측 정렬(컬럼 기준), n줄 전부 노출(클램프 없음).
            Body S(14/21), feed-card/body/body-text */}
        <p className="mt-[7px] whitespace-pre-wrap text-body-s text-feed-card-body-text">
          {comment.body}
        </p>

        {/* 본문 바로 하단 반응 행(본문과 간격 0): (최상위만) 답글 · 좋아요(+카운트) · ⋮.
            높이 28 고정, 우측 정렬. 버튼 사이 간격 4(gap-1).
            색/상태는 comment-reaction-styles가 단일 출처. */}
        <div className="flex h-7 items-center justify-end gap-1">
          {/* 답글은 최상위 댓글에만 둔다(#131) — 대댓글에 대댓글이 달리지 않는 구조라
              대댓글의 답글 버튼은 탭한 대상(대댓글 작성자)이 아니라 최상위 스레드에 붙어
              가리키는 대상이 어긋났고, replyCount도 자기 자식 수라 항상 0이었다. */}
          {isReply ? null : (
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
