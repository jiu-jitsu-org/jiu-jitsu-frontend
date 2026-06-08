import type { Comment } from "@/features/community/domain/comment";
import { CommentItem } from "@/features/community/presentation/comment-item";

/**
 * 댓글 목록 (서버 컴포넌트). 항목 사이 구분선.
 *
 * FIXME: nextCursor 기반 "더 보기" 페이지네이션은 목록 정책 확정 후 추가.
 */
export function CommentList({ comments }: { comments: Comment[] }) {
  return (
    <ul className="divide-y divide-border-default">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </ul>
  );
}
