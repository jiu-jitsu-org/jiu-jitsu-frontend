import { notFound, redirect, unstable_rethrow } from "next/navigation";

import { SessionExpiredRecovery } from "@/features/auth/presentation/session-expired-recovery";
import { createGetPostDetailUseCase } from "@/features/community/application/community-use-case-factory";
import { getPostCategoriesOrFallback } from "@/features/community/application/get-post-write-page-data";
import type { PostEditInitial } from "@/features/community/domain/post";
import { PostWriteScreen } from "@/features/community/presentation/post-write-screen";
import { readSessionToken } from "@/shared/lib/auth";
import { ApiErrorCode, toApiError } from "@/shared/lib/http";

/**
 * 게시글 수정 라우트. 피드/상세 ⋮ 메뉴의 "수정하기"(useOpenPostEdit)가 여는 화면.
 *
 * 작성 화면(PostWriteScreen)을 수정 모드로 재사용한다 — 같은 폼이라 화면을 따로 두면 중복(#44).
 * 초기값은 상세(GET /board/{id})를 Server Component에서 직접 읽어 편집 가능한 필드만 추린다.
 * 본인 글이 아니면(viewer.isOwner=false) 폼을 보여줄 이유가 없어 상세로 돌려보낸다 — 업스트림도
 * PUT에서 권한을 다시 검사하므로 이 분기는 UX용이다.
 */
export default async function CommunityPostEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isInteger(postId) || postId <= 0) {
    notFound();
  }

  const accessToken = await readSessionToken();
  // 비로그인은 수정 불가 — 상세로 보낸다(상세가 로그인 유도를 담당).
  if (!accessToken) {
    redirect(`/community/${postId}`);
  }

  let initial: PostEditInitial;
  try {
    const post = await createGetPostDetailUseCase(accessToken).execute(postId);
    if (!post.viewer.isOwner) {
      redirect(`/community/${postId}`);
    }
    initial = {
      categoryId: post.categoryId,
      title: post.title,
      body: post.body,
      images: post.images,
      tags: post.tags,
    };
  } catch (error) {
    // redirect()는 Next 내부 예외로 동작하므로 삼키지 않고 다시 던진다.
    unstable_rethrow(error);
    const apiError = toApiError(error);
    // 만료 토큰 → 클라이언트가 네이티브 갱신 후 이 화면을 재실행(router.refresh)해 인증 상태로 복구.
    if (apiError.code === ApiErrorCode.EXPIRED_TOKEN) {
      return <SessionExpiredRecovery loading={<EditLoading />} />;
    }
    // 삭제·숨김 등으로 열 수 없는 글 — 상세와 같은 404 처리.
    notFound();
  }

  const categories = await getPostCategoriesOrFallback();
  return <PostWriteScreen categories={categories} edit={{ postId, initial }} />;
}

/** 수정 화면 복구(세션 갱신) 중 표시. */
function EditLoading() {
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
