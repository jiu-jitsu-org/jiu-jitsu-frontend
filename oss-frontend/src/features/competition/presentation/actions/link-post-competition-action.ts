"use server";

import { createGetPostDetailUseCase } from "@/features/community/application/community-use-case-factory";
import { createLinkPostCompetitionUseCase } from "@/features/competition/application/competition-use-case-factory";
import { isCompetitionPageEnabled } from "@/features/competition/application/is-competition-page-enabled";
import { readSessionToken } from "@/shared/lib/auth";

/**
 * 글이 고른 대회 저장 Server Action (#367). 글을 올리거나 고친 직후 글쓰기 화면이 부른다.
 *
 * 글 주인만 바꿀 수 있다 — 서버에서 글을 다시 읽어 내 글인지 보고, 대회 이야기에 보일 제목·올린 때도 그 글에서 가져온다
 * (화면이 보낸 값은 믿지 않는다). 대회 데이터가 가짜인 동안은 대회 탭을 여는 환경에서만 받는다.
 * 글 저장 API가 대회를 받게 되면 글 저장 요청에 함께 실어 보내고 이 Action은 지운다.
 */
export async function linkPostCompetitionAction(
  postId: number,
  competitionId: string | null,
): Promise<{ ok: boolean }> {
  if (
    !isCompetitionPageEnabled() ||
    typeof postId !== "number" ||
    !Number.isInteger(postId) ||
    postId <= 0 ||
    (competitionId !== null &&
      (typeof competitionId !== "string" ||
        competitionId.length === 0 ||
        competitionId.length > 100))
  ) {
    return { ok: false };
  }
  const accessToken = await readSessionToken();
  if (accessToken === null) return { ok: false };

  try {
    const post = await createGetPostDetailUseCase(accessToken).execute(postId);
    if (!post.viewer.isOwner) return { ok: false };
    await createLinkPostCompetitionUseCase().execute(
      { postId, title: post.title, createdAt: post.createdAt },
      competitionId,
    );
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
