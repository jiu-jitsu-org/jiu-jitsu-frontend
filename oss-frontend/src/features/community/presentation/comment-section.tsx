import type { CommentList as CommentListData } from "@/features/community/domain/comment";
import type { CommentSort } from "@/features/community/domain/post";
import { CommentEmpty } from "@/features/community/presentation/comment-empty";
import { CommentList } from "@/features/community/presentation/comment-list";
import { CommentSortSelect } from "@/features/community/presentation/comment-sort-select";

/**
 * 댓글 섹션 (서버 컴포넌트).
 *
 * 상단에 정렬 드롭다운(클라이언트 leaf), 아래에 빈 상태 또는 목록을 렌더한다.
 */
export function CommentSection({
  comments,
  sort,
}: {
  comments: CommentListData;
  sort: CommentSort;
}) {
  const hasComments = comments.items.length > 0;

  return (
    <section className="flex flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <CommentSortSelect sort={sort} />
        {hasComments ? (
          <span className="text-xs text-text-tertiary">
            댓글 {comments.total}
          </span>
        ) : null}
      </div>

      {hasComments ? (
        <div className="px-4">
          <CommentList comments={comments.items} />
        </div>
      ) : (
        <CommentEmpty />
      )}
    </section>
  );
}
