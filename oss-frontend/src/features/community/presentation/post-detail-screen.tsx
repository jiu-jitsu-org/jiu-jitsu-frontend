import { notFound } from "next/navigation";

import { getPostDetailPageData } from "@/features/community/application/get-post-detail-page-data";
import type { CommentSort } from "@/features/community/domain/post";
import { PostDetailView } from "@/features/community/presentation/post-detail-view";
import { ApiErrorCode } from "@/shared/lib/http";

/**
 * 게시글 상세 화면 루트 (서버 컴포넌트).
 *
 * application use case를 서버에서 직접 호출(내부 HTTP 왕복 회피)해 상세+댓글을 가져온 뒤
 * 순수 표현 컴포넌트 PostDetailView에 넘긴다. 조회 실패는 404/에러 화면으로 분기.
 */
export async function PostDetailScreen({
  postId,
  sort,
}: {
  postId: number;
  sort: CommentSort;
}) {
  const result = await getPostDetailPageData(postId, sort);

  if (!result.ok) {
    // 존재하지 않는 게시글(C0002) → 404. 그 외는 코드별 메시지로 간단한 에러 화면.
    if (result.code === ApiErrorCode.BOARD_NOT_FOUND || result.status === 404) {
      notFound();
    }
    return <PostDetailError message={result.error} />;
  }

  const { post, comments } = result.data;

  return <PostDetailView post={post} comments={comments} sort={sort} />;
}

function PostDetailError({ message }: { message: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="text-base font-medium text-text-primary">
        게시글을 불러오지 못했습니다.
      </p>
      <p className="text-sm text-text-tertiary">{message}</p>
    </div>
  );
}
