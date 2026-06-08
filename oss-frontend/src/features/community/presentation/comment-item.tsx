import type { Comment } from "@/features/community/domain/comment";
import { PersonIcon } from "@/shared/ui/icons";

/** ISO → "M월 D일" 간단 라벨. 파싱 실패 시 원문 반환. */
function formatCommentDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

/**
 * 단일 댓글 행 (서버 컴포넌트).
 *
 * FIXME: isOwner일 때 삭제 메뉴 노출은 댓글 삭제 API 스펙 확정 후 추가(현재 표시만).
 */
export function CommentItem({ comment }: { comment: Comment }) {
  return (
    <li className="flex gap-2 py-3">
      <span className="inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-feed-card-header-avatar-bg text-icon-subtle">
        {comment.author.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={comment.author.avatarUrl}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <PersonIcon size={18} />
        )}
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-feed-card-header-username-text">
            {comment.author.nickname}
          </span>
          <time
            dateTime={comment.createdAt}
            className="text-xs text-text-tertiary"
          >
            {formatCommentDate(comment.createdAt)}
          </time>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-[21px] text-feed-card-body-text">
          {comment.body}
        </p>
      </div>
    </li>
  );
}
