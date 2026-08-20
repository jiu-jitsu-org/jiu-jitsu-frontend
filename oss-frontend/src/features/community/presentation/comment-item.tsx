import type { ReactNode } from "react";

import type { Comment } from "@/features/community/domain/comment";
import {
  COMMENT_REACTION_BUTTON,
  COMMENT_REACTION_ICON,
  COMMENT_REACTION_TEXT,
  COMMENT_REACTION_TEXT_ACTIVE,
} from "@/features/community/presentation/comment-reaction-styles";
import { Avatar } from "@/features/community/presentation/avatar";
import { CommentLikeButton } from "@/features/community/presentation/comment-like-button";
import { CommentMenu } from "@/features/community/presentation/comment-menu";
import { CommentReplies } from "@/features/community/presentation/comment-replies";
import { cn } from "@/shared/lib/cn";
import { CommentIcon } from "@/shared/ui/icons";

/** ISO → "M월 D일" 간단 라벨. 파싱 실패 시 원문 반환. */
function formatCommentDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

/**
 * 단일 댓글 행 (서버 컴포넌트, 초안).
 *
 * 구성: 아바타 + 닉네임(+"작성자" 배지) + 날짜 / 본문 / 반응 행(댓글쓰기·좋아요·⋮).
 * FIXME(초안): 반응 토글·답글·⋮ 메뉴 동작과 정확한 디자인 토큰/간격은 가이드 확정 후 적용.
 */
export function CommentItem({ comment }: { comment: Comment }) {
  return (
    // 아바타↔콘텐츠 간격 4(gap-1). 아바타는 프로필 행(닉네임/날짜)과 수직 가운데 정렬.
    // 세로 패딩 없음 — 댓글 사이 간격(12)은 목록(ul gap-3)이 담당.
    <li className="flex gap-1">
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
            {formatCommentDate(comment.createdAt)}
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
          {/* 답글: 0개=아이콘+"댓글쓰기" / 1개+=아이콘+숫자 / 내가 단 적 있으면 fill 아이콘+숫자(색은 동일) */}
          <CommentReaction
            icon={<CommentIcon size={16} filled={comment.replied} />}
            label="댓글쓰기"
            count={comment.replyCount}
            active={comment.replied}
            activeIconColorClass="text-reaction-bar-active-comment-icon"
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
          <CommentReplies>
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} />
            ))}
          </CommentReplies>
        ) : null}
      </div>
    </li>
  );
}

/**
 * 댓글 반응 단일 버튼(초안) — 카운트 0이면 라벨, 1+면 숫자.
 * 액션바와 달리 기본 배경이 없는 가벼운 형태. Default/Pressed/Active는 comment-reaction-styles 참고.
 */
function CommentReaction({
  icon,
  label,
  count,
  active = false,
  activeIconColorClass,
}: {
  icon: ReactNode;
  label: string;
  count: number;
  /** 내가 이 댓글에 답글을 단 적 있는지 — 아이콘 fill은 호출부가 전달한다. */
  active?: boolean;
  activeIconColorClass?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        COMMENT_REACTION_BUTTON,
        COMMENT_REACTION_ICON,
        active && activeIconColorClass,
      )}
    >
      {icon}
      <span
        className={cn(
          COMMENT_REACTION_TEXT,
          active && COMMENT_REACTION_TEXT_ACTIVE,
        )}
      >
        {count > 0 ? count : label}
      </span>
    </button>
  );
}
