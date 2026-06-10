import { Suspense } from "react";

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
        {/* useSearchParams() leaf — 정적 prerender에서 빠지도록 Suspense로 감싼다.
            fallback은 높이 32 자리만 유지해 레이아웃 시프트를 막는다. */}
        <Suspense fallback={<div className="h-8" />}>
          <CommentSortSelect sort={sort} />
        </Suspense>
        {hasComments ? (
          <span className="text-xs text-text-tertiary">
            댓글 {comments.total}
          </span>
        ) : null}
      </div>

      {hasComments ? (
        // 최신순 버튼 바텀↔첫 댓글 24 = 정렬 row pb-3(12) + 여기 pt-3(12). 하단 여유 pb-4.
        <div className="px-4 pb-4 pt-3">
          <CommentList comments={comments.items} />
        </div>
      ) : (
        <CommentEmpty />
      )}
    </section>
  );
}
