import type { Comment } from "@/features/community/domain/comment";
import { CommentItem } from "@/features/community/presentation/comment-item";

/**
 * 댓글 목록 (서버 컴포넌트). 항목 사이 간격 12, 구분선 없음.
 *
 * FIXME: nextCursor 기반 "더 보기" 페이지네이션은 목록 정책 확정 후 추가.
 */
export function CommentList({ comments }: { comments: Comment[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </ul>
  );
}
