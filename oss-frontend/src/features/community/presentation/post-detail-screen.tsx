import { notFound } from "next/navigation";

import { getPostDetailPageData } from "@/features/community/application/get-post-detail-page-data";
import { SessionExpiredRecovery } from "@/features/auth/presentation/session-expired-recovery";
import type { CommentSort } from "@/features/community/domain/post";
import { PostDetailView } from "@/features/community/presentation/post-detail-view";
import { ApiErrorCode } from "@/shared/lib/http";

/**
 * 게시글 상세 화면 루트 (서버 컴포넌트).
 *
 * application use case를 서버에서 직접 호출(내부 HTTP 왕복 회피)해 상세+댓글을 가져온 뒤
 * 순수 표현 컴포넌트 PostDetailView에 넘긴다. 조회 실패는 404/에러 화면으로 분기.
 *
 * 만료 토큰이면 서버는 갱신 불가 → SessionExpiredRecovery에 위임(네이티브 갱신 후 SSR 재실행).
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
    // 만료 토큰 → 클라이언트가 네이티브 갱신 후 이 화면을 재실행(router.refresh)해 인증 상태로 복구.
    if (result.reason === "session-expired") {
      return (
        <SessionExpiredRecovery
          loading={<PostDetailLoading />}
          fallback={<PostDetailError message="다시 로그인해 주세요." />}
        />
      );
    }

    // 존재하지 않는 게시글(C0002) → 404. 그 외는 코드별 메시지로 간단한 에러 화면.
    if (result.code === ApiErrorCode.BOARD_NOT_FOUND || result.status === 404) {
      notFound();
    }
    return <PostDetailError message={result.error} />;
  }

  const { post, comments } = result.data;

  return <PostDetailView post={post} comments={comments} sort={sort} />;
}

/** 상세 복구(세션 갱신) 중 표시. */
function PostDetailLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <span
        className="size-6 animate-spin rounded-full border-2 border-feed-card-header-avatar-bg border-t-transparent"
        role="status"
        aria-label="불러오는 중"
      />
    </div>
  );
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
