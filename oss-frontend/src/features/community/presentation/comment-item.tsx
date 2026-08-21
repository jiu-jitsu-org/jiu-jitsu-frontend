import type { Comment } from "@/features/community/domain/comment";
import { Avatar } from "@/features/community/presentation/avatar";
import { CommentLikeButton } from "@/features/community/presentation/comment-like-button";
import { CommentReplyButton } from "@/features/community/presentation/comment-reply-button";
import { CommentMenu } from "@/features/community/presentation/comment-menu";
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
 * 단일 댓글 행 (서버 컴포넌트, 초안).
 *
 * 구성: (대댓글이면 분기 아이콘 +) 아바타 + 닉네임(+"작성자" 배지) + 날짜 / 본문 / 반응 행.
 * FIXME(초안): 반응 토글·답글·⋮ 메뉴 동작과 정확한 디자인 토큰/간격은 가이드 확정 후 적용.
 */
export function CommentItem({
  comment,
  isReply = false,
  replyParentId,
}: {
  comment: Comment;
  /** 대댓글이면 아바타 앞에 분기 아이콘을 붙인다. */
  isReply?: boolean;
  /**
   * 이 행의 답글 버튼이 서버로 보낼 parentId.
   * 최상위 댓글은 자기 id, 대댓글은 부모(최상위) id가 들어온다 — 중첩을 1단계로 묶기 위함.
   */
  replyParentId?: number;
}) {
  // 대댓글에서 답글을 달아도 최상위 댓글 아래에 붙는다(무한 중첩 방지).
  const parentId = replyParentId ?? comment.id;
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
          className="shrink-0 self-start text-feed-card-header-avatar-bg"
        />
      ) : null}
      {/* 프로필 아이콘 24x24, 로드 실패 시 기본 상태 폴백 */}
      <Avatar src={comment.author.avatarUrl} className="size-6" iconSize={16} />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 프로필 행: 높이 24(아바타와 동일)로 두고 items-center → 아이콘 기준 수직 가운데.
            닉네임↔날짜 간격 6(gap-1.5). */}
        <div className="flex h-6 items-center gap-1.5">
          {/* 닉네임: Body M, feed-card/header/username-text */}
          <span className="text-base font-medium text-feed-card-header-username-text">
            {comment.author.nickname}
          </span>
          {comment.isPostAuthor ? (
            // 작성자 배지: comment-author-badge 토큰, radius 4, 패딩 좌우4·상하2, Label M
            <span className="rounded bg-comment-author-badge-bg px-1 py-0.5 text-xs font-medium text-comment-author-badge-text">
              작성자
            </span>
          ) : null}
          {/* 날짜: Label M, feed-card/header/date-text */}
          <time
            dateTime={comment.createdAt}
            className="text-xs font-medium text-feed-card-header-date-text"
          >
            {comment.timeAgo ?? formatCommentDate(comment.createdAt)}
          </time>
        </div>
        {/* 본문: 프로필 행과 간격 7, 닉네임 좌측 정렬(컬럼 기준), n줄 전부 노출(클램프 없음).
            Body S(14/21), feed-card/body/body-text */}
        <p className="mt-[7px] whitespace-pre-wrap text-sm leading-[21px] text-feed-card-body-text">
          {comment.body}
        </p>

        {/* 본문 바로 하단 반응 행(본문과 간격 0): 답글 · 좋아요(+카운트) · ⋮. 높이 28 고정, 우측 정렬.
            버튼 사이 간격 4(gap-1). 색/상태는 comment-reaction-styles가 단일 출처. */}
        <div className="flex h-7 items-center justify-end gap-1">
          {/* 답글: 탭하면 하단 입력 바가 답글 모드로 전환된다. */}
          <CommentReplyButton
            parentId={parentId}
            nickname={comment.author.nickname}
            replyCount={comment.replyCount}
            replied={comment.replied}
          />
          <CommentLikeButton
            commentId={comment.id}
            initialLiked={comment.liked}
            initialLikeCount={comment.likeCount}
          />
          {/* ⋮ 메뉴: 내 댓글=삭제 / 타인 댓글=차단·신고. 차단 시 닉네임으로 확인 알럿 */}
          <CommentMenu
            commentId={comment.id}
            isOwner={comment.isOwner}
            authorNickname={comment.author.nickname}
          />
        </div>

        {/* 대댓글: 같은 댓글 폼을 들여쓰기로 재사용(콘텐츠 컬럼 안에 두어 부모 닉네임 기준 정렬).
            최초 2개만 노출, 초과분은 "대댓글 N개 더보기"로 펼침. */}
        {comment.replies.length > 0 ? (
          <CommentReplies commentId={comment.id}>
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                isReply
                replyParentId={comment.id}
              />
            ))}
          </CommentReplies>
        ) : null}
      </div>
    </li>
  );
}
