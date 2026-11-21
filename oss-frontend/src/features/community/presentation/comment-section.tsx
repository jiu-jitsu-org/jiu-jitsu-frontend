import { Suspense } from "react";

import type {
  Comment,
  CommentList as CommentListData,
} from "@/features/community/domain/comment";
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
  contentId,
  comments,
  focusedComment = null,
  sort,
  postAuthorId,
}: {
  /** 댓글이 달린 컨텐츠(게시글·밸런스 게임) id — 다음 페이지 조회에 쓴다. */
  contentId: number;
  /** 서버 렌더 첫 페이지 — 나머지는 CommentList가 「댓글 더보기」로 이어 받는다(#592). */
  comments: CommentListData;
  /** 알림에서 연 댓글(#596) — 목록 맨 위에 먼저 보인다. 정렬을 바꾸면 주소에서 빠져 사라진다. */
  focusedComment?: Comment | null;
  sort: CommentSort;
  /** 게시글 작성자 id — 대댓글 더보기로 불러온 줄의 "작성자" 배지 판정에 쓴다.
      밸런스 게임은 작성자가 없는 컨텐츠라 넘기지 않는다. */
  postAuthorId?: number | null;
}) {
  return (
    <section className="flex flex-col">
      {/* 제목 "댓글"(왼쪽) + 정렬(오른쪽) — 아래 "○○의 다른 글"과 같은 제목(Body M Semibold, 좌 16)으로 구역을 읽히게 하고,
          정렬은 회색 Label M으로 한 단계 낮춘다. 제목 글자 위 = 띠에서 24(pt-5 20 + 줄 32 안 가운데 4) — "다른 글" 제목과 같다.
          오른쪽 16 = pr-3 12 + 정렬 버튼 안쪽 pr-1 4(화살표 끝이 화면 여백선에 선다).
          댓글 수는 리액션바의 댓글 버튼이 카운트로 보여주므로 제목에 두지 않는다. */}
      <div className="flex items-center justify-between pb-3 pl-4 pr-3 pt-5">
        <h2 className="text-body-m font-semibold text-text-primary">댓글</h2>
        {/* useSearchParams() leaf — 정적 prerender에서 빠지도록 Suspense로 감싼다.
            fallback은 높이 32 자리만 유지해 레이아웃 시프트를 막는다. */}
        <Suspense fallback={<div className="h-8" />}>
          <CommentSortSelect sort={sort} />
        </Suspense>
      </div>

      {/* 빈 상태도 목록이 고른다 — 첫 댓글을 달면 서버 렌더를 기다리지 않고 바로 목록으로 바뀐다(#486). */}
      <CommentList
        contentId={contentId}
        comments={comments.items}
        hasNext={comments.hasNext}
        focusedComment={focusedComment}
        sort={sort}
        postAuthorId={postAuthorId}
        empty={<CommentEmpty />}
      />
    </section>
  );
}
