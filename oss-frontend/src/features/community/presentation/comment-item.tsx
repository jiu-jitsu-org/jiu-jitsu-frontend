import type { ReactNode } from "react";

import type { Comment } from "@/features/community/domain/comment";
import {
  CommentIcon,
  HeartIcon,
  MoreVerticalIcon,
  PersonIcon,
} from "@/shared/ui/icons";

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
      {/* 프로필 아이콘 24x24 */}
      <span className="inline-flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-feed-card-header-avatar-bg text-icon-subtle">
        {comment.author.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={comment.author.avatarUrl}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <PersonIcon size={16} />
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 프로필 행: 높이 24(아바타와 동일)로 두고 items-center → 아이콘 기준 수직 가운데.
            닉네임↔날짜 간격 6(gap-1.5). */}
        <div className="flex h-6 items-center gap-1.5">
          {/* 닉네임: Body M, feed-card/header/username-text */}
          <span className="text-base font-medium text-feed-card-header-username-text">
            {comment.author.nickname}
          </span>
          {comment.isPostAuthor ? (
            // 작성자 배지: 배경 Blue/50, 텍스트 Blue/500(P), radius 4, 패딩 좌우4·상하2, Label M
            <span className="rounded bg-[var(--blue-50)] px-1 py-0.5 text-xs font-medium text-[var(--blue-500p)]">
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
            버튼 사이 간격 4(gap-1). 아이콘 색 reaction-bar/default/icon, 텍스트 reaction-bar/default/count-text. */}
        <div className="flex h-7 items-center justify-end gap-1">
          {/* 답글: 0개=아이콘+"댓글쓰기" / 1개+=아이콘+숫자 / 내가 단 적 있으면 fill 아이콘+숫자(색은 동일) */}
          <CommentReaction
            icon={<CommentIcon size={16} filled={comment.replied} />}
            label="댓글쓰기"
            count={comment.replyCount}
          />
          <CommentReaction
            icon={<HeartIcon size={16} filled={comment.liked} />}
            label="좋아요"
            count={comment.likeCount}
          />
          {/* 메뉴 버튼: eclipsis-vertical 16, 아이콘만, 좌우 여백 8(px-2), 높이 28(h-7) */}
          <button
            type="button"
            aria-label="댓글 메뉴"
            className="inline-flex h-7 items-center justify-center px-2 text-reaction-bar-default-icon"
          >
            <MoreVerticalIcon size={16} />
          </button>
        </div>
      </div>
    </li>
  );
}

/**
 * 댓글 반응 단일 버튼(초안) — 카운트 0이면 라벨, 1+면 숫자.
 * 액션바와 달리 배경 없는 가벼운 형태. 높이 28(h-7), 활성은 아이콘 fill로만 표시(색 통일).
 * 아이콘 색 reaction-bar/default/icon, 텍스트 reaction-bar/default/count-text + Body S(14/21).
 */
function CommentReaction({
  icon,
  label,
  count,
}: {
  icon: ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="inline-flex h-7 items-center gap-1 px-2 text-reaction-bar-default-icon"
    >
      {icon}
      <span className="text-sm leading-[21px] text-reaction-bar-default-count-text">
        {count > 0 ? count : label}
      </span>
    </button>
  );
}
