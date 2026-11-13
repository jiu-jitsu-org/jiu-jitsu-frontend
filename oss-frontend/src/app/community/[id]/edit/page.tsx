import { notFound, redirect, unstable_rethrow } from "next/navigation";

import { SessionExpiredRecovery } from "@/features/auth/presentation/session-expired-recovery";
import { createGetPostDetailUseCase } from "@/features/community/application/community-use-case-factory";
import { getPostCategoriesOrFallback } from "@/features/community/application/get-post-write-page-data";
import type { PostEditInitial } from "@/features/community/domain/post";
import { PostWriteScreen } from "@/features/community/presentation/post-write-screen";
import { WriteSkeleton } from "@/features/community/presentation/write-skeleton";
import { getCompetitionPickerOptions } from "@/features/competition/application/get-competition-picker-options";
import type { Competition } from "@/features/competition/domain/competition";
import { POST_EDIT_FROM_DETAIL } from "@/features/community/presentation/post-edit-return";
import { readSessionToken } from "@/shared/lib/auth";
import { ApiErrorCode, toApiError } from "@/shared/lib/http";
import { NativePageReady } from "@/shared/lib/native-bridge";
import { readServerNow, toKstDateKey } from "@/shared/lib/time";


/**
 * 게시글 수정 라우트. 피드/상세 ⋮ 메뉴의 "수정하기"(useOpenPostEdit)가 여는 화면.
 *
 * 작성 화면(PostWriteScreen)을 수정 모드로 재사용한다 — 같은 폼이라 화면을 따로 두면 중복(#44).
 * 초기값은 상세(GET /board/{id})를 Server Component에서 직접 읽어 편집 가능한 필드만 추린다.
 * 본인 글이 아니면(viewer.isOwner=false) 폼을 보여줄 이유가 없어 상세로 돌려보낸다 — 업스트림도
 * PUT에서 권한을 다시 검사하므로 이 분기는 UX용이다.
 *
 * `?from=detail`은 상세 ⋮에서 연 수정 — 성공 후 원래 상세로 돌아간다(#157, useOpenPostEdit).
 */
export default async function CommunityPostEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  const [{ id }, { from }] = await Promise.all([params, searchParams]);
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
  // 이 글이 고른 대회(#417) — 대회가 미공개로 바뀌어 카드가 없어도 id는 온다. 수정 때 그대로 다시 보낸다.
  let competitionId: number | null = null;
  let competition: Competition | null = null;
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
      competitionId: post.competitionId,
    };
    competitionId = post.competitionId;
    competition = post.competition ?? null;
  } catch (error) {
    // redirect()는 Next 내부 예외로 동작하므로 삼키지 않고 다시 던진다.
    unstable_rethrow(error);
    const apiError = toApiError(error);
    // 만료 토큰 → 클라이언트가 네이티브 갱신 후 이 화면을 재실행(router.refresh)해 인증 상태로 복구.
    if (apiError.code === ApiErrorCode.EXPIRED_TOKEN) {
      return <SessionExpiredRecovery loading={<WriteSkeleton mode="edit" showBack />} />;
    }
    // 삭제·숨김 등으로 열 수 없는 글 — 상세와 같은 404 처리.
    notFound();
  }

  const now = readServerNow();
  // 대회 고르기(#367 · #421) — 이 글이 이미 고른 대회는 고르기 목록 밖이어도 맨 위에 넣어 보이고 지울 수 있게 한다.
  const [categories, competitionOptions] = await Promise.all([
    getPostCategoriesOrFallback(),
    getCompetitionPickerOptions({
      include: competition,
      includeId: competition ? null : competitionId,
    }),
  ]);
  return (
    <>
      <PostWriteScreen
        categories={categories}
        competitionPicker={
          competitionOptions.length > 0
            ? {
                options: competitionOptions,
                initialId: competitionId,
                currentYear: Number(toKstDateKey(now).slice(0, 4)),
              }
            : undefined
        }
        edit={{
          postId,
          initial,
          returnToDetail: from === POST_EDIT_FROM_DETAIL,
        }}
      />
      {/* 수정 화면이 그려지면 앱이 로딩 덮개를 걷는다(jiu-jitsu-ios#261). 만료 복구 중(스켈레톤)과 복구 실패 안내에는 보내지 않는다. */}
      <NativePageReady />
    </>
  );
}
