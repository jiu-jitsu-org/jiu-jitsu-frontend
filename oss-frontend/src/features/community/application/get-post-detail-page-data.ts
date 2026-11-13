import { cache } from "react";

import { withSampleDetailBelts } from "@/features/community/application/belt-avatar-sample";
import {
  createGetCommentsUseCase,
  createGetPostDetailUseCase,
} from "@/features/community/application/community-use-case-factory";
import {
  markPostAuthorComments,
  type CommentList,
} from "@/features/community/domain/comment";
import type { CommentSort, PostDetail } from "@/features/community/domain/post";
import { isDevelopmentRuntime } from "@/config/env";
import { readSessionToken } from "@/shared/lib/auth";
import { ApiErrorCode, toApiError } from "@/shared/lib/http";
import { withoutCompetitionWhenDisabled } from "@/features/competition/application/is-competition-enabled";
import { loadCompetitionAlertSettings } from "@/features/competition/application/load-competition-alert-settings";
import type { CompetitionAlertSettings } from "@/features/competition/domain/competition-alert";

export type PostDetailPageData = {
  post: PostDetail;
  comments: CommentList;
  /**
   * 관심 대회 알림 설정(#375) — 글이 고른 대회 카드(post.competition, #380)의 하트로 처음 관심 등록하면 시트를 띄운다.
   * 대회 카드가 없거나 비로그인·못 읽으면 null.
   */
  competitionAlertSettings: CompetitionAlertSettings | null;
};

export type PostDetailPageDataResult =
  | { ok: true; data: PostDetailPageData }
  // 만료 토큰 — 서버는 갱신 불가하니 클라이언트가 네이티브 갱신 후 재조회(SSR 재실행)한다.
  | { ok: false; reason: "session-expired" }
  | { ok: false; reason: "error"; status: number; code: string; error: string };

/**
 * 게시글 상세 단건 조회 — 한 요청 안에서 한 번만 나간다.
 *
 * 같은 요청에서 generateMetadata(공유 미리보기)와 페이지 본문이 각각 상세를 필요로 한다.
 * React cache로 묶어 업스트림 호출을 한 번으로 합친다(같은 postId·토큰이면 결과 공유).
 */
export const loadPostDetail = cache(
  (postId: number, accessToken: string | null): Promise<PostDetail> =>
    createGetPostDetailUseCase(accessToken).execute(postId),
);

/** 댓글 API 미연동 시 폴백(상세만으로도 화면이 뜨도록). */
const EMPTY_COMMENTS: CommentList = { items: [], hasNext: false };

/**
 * 상세 화면 Server Component용 페이지 쿼리.
 *
 * 자체 BFF route로 다시 HTTP 요청하지 않고 application use case를 직접 호출한다.
 * Server Component -> Application -> Domain 계약 -> Infrastructure -> HTTP 흐름은 유지한다.
 * (bootstrap의 get-bootstrap-info-page-data 패턴)
 *
 * 세션 토큰이 있으면 함께 넘겨 viewer 상태를 채운다(비로그인도 본문 열람 가능).
 * 에러는 공통 ApiError로 정규화 → 호출부가 code로 분기(예: BOARD_NOT_FOUND → 404).
 *
 * sampleBelts는 `next dev`에서만 받아들인다 — 글·댓글 작성자에 예시 띠·그랄을 얹는다(belt-avatar-sample).
 */
export async function getPostDetailPageData(
  postId: number,
  sort: CommentSort,
  sampleBelts = false,
): Promise<PostDetailPageDataResult> {
  const accessToken = await readSessionToken();

  try {
    const loaded = await loadPostDetail(postId, accessToken);
    // 대회 화면이 꺼진 배포에서는 대회 카드를 뗀다(competitionId는 남아 수정 때 다시 보낸다, #417).
    const [post] = withoutCompetitionWhenDisabled([loaded]);

    // 댓글은 첫 페이지만 받는다 — 다음 페이지는 화면이 무한 스크롤로 이어 받는다(#222).
    // 댓글 목록 조회가 실패해도 게시글 상세는 보이도록 빈 목록으로 폴백(graceful degradation).
    // 고른 대회 카드(#380)는 상세 응답에 실려 온다. 알림 설정은 덧붙는 정보라 못 읽으면 빠질 뿐이다.
    const [comments, competitionAlertSettings] = await Promise.all([
      createGetCommentsUseCase(accessToken)
        .execute(postId, sort)
        .catch(() => EMPTY_COMMENTS),
      post.competition && accessToken ? loadCompetitionAlertSettings() : null,
    ]);

    // 게시글 작성자 본인이 단 댓글에 "작성자" 배지를 채운다(응답에 직접 필드가 없어 id 비교로 도출).
    const commentsWithAuthor: CommentList = {
      ...comments,
      items: markPostAuthorComments(comments.items, post.author.userId),
    };

    if (sampleBelts && isDevelopmentRuntime()) {
      const sample = withSampleDetailBelts(post, commentsWithAuthor.items);
      return {
        ok: true,
        data: {
          post: sample.post,
          comments: { ...commentsWithAuthor, items: sample.comments },
          competitionAlertSettings,
        },
      };
    }
    return {
      ok: true,
      data: { post, comments: commentsWithAuthor, competitionAlertSettings },
    };
  } catch (error) {
    const apiError = toApiError(error);

    // 로그인 상태에서 토큰 만료 → 클라이언트가 네이티브 갱신 후 SSR 재실행하도록 위임.
    if (accessToken && apiError.code === ApiErrorCode.EXPIRED_TOKEN) {
      return { ok: false, reason: "session-expired" };
    }

    return {
      ok: false,
      reason: "error",
      status: apiError.status,
      code: apiError.code,
      error: apiError.message,
    };
  }
}
