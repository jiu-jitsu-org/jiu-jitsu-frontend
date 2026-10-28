import type { Comment } from "@/features/community/domain/comment";
import type { CommentSort } from "@/features/community/domain/post";
import { CommentItem } from "@/features/community/presentation/comment-item";

/**
 * 댓글 목록 (서버 컴포넌트). 항목 사이 간격 24, 구분선 없음.
 *
 * 간격 위계(#258): 묶음 안(부모→답글, 답글↔답글)은 8, 묶음 사이(최상위 댓글↔다음 최상위)는 24.
 * 셋 다 12로 같으면 마지막 답글·「대댓글 더보기」가 다음 댓글에도 붙어 보여 스레드 경계가 사라진다.
 * 선 없이 간격만으로 "한 댓글 + 그 답글들 = 한 덩어리"로 읽히게 한다.
 *
 * sort·postAuthorId는 이 컴포넌트가 쓰지 않고 대댓글 더보기(CommentReplies)까지 내려보내는
 * 값이다. 추가로 불러온 대댓글이 목록과 같은 정렬을 쓰고 "작성자" 배지도 같은 기준으로
 * 붙으려면 둘 다 필요하다.
 *
 * FIXME: nextCursor 기반 "더 보기" 페이지네이션은 목록 정책 확정 후 추가.
 */
export function CommentList({
  comments,
  sort,
  postAuthorId,
}: {
  comments: Comment[];
  sort: CommentSort;
  postAuthorId?: number | null;
}) {
  return (
    <ul className="flex flex-col gap-6">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          sort={sort}
          postAuthorId={postAuthorId}
        />
      ))}
    </ul>
  );
}
