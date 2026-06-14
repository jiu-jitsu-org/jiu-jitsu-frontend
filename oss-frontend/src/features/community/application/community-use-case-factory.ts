import { CreateCommentUseCase } from "@/features/community/application/create-comment";
import { CreatePostUseCase } from "@/features/community/application/create-post";
import { CreateReportUseCase } from "@/features/community/application/create-report";
import { DeleteCommentUseCase } from "@/features/community/application/delete-comment";
import { DeletePostUseCase } from "@/features/community/application/delete-post";
import { GetCommentsUseCase } from "@/features/community/application/get-comments";
import { GetImageUploadAuthUseCase } from "@/features/community/application/get-image-upload-auth";
import { RegisterImageUseCase } from "@/features/community/application/register-image";
import { GetPostDetailUseCase } from "@/features/community/application/get-post-detail";
import { ToggleBookmarkUseCase } from "@/features/community/application/toggle-bookmark";
import { ToggleCommentLikeUseCase } from "@/features/community/application/toggle-comment-like";
import { ToggleLikeUseCase } from "@/features/community/application/toggle-like";
import { ExternalCommunityWriteRepository } from "@/features/community/infrastructure/external-community-write-repository";
import { ExternalPostRepository } from "@/features/community/infrastructure/external-post-repository";
import {
  createAuthedServerHttpClient,
  createServerHttpClient,
} from "@/shared/lib/http/create-server-http-client";

/**
 * community feature 조립부.
 *
 * 읽기(상세/댓글): 토큰이 있으면 authed 클라이언트로 viewer 상태까지 채우고, 없으면
 *   unauthed 클라이언트로 익명 조회한다(비로그인도 본문 열람 가능).
 * 쓰기(댓글/좋아요/북마크): 반드시 인증이 필요하므로 authed 클라이언트만 사용한다.
 *
 * Server Component와 Route Handler가 동일 use case를 공유한다(bootstrap/profile 패턴).
 */

/** 토큰 유무에 따라 읽기용 클라이언트를 고른다. */
function createReadRepository(accessToken: string | null): ExternalPostRepository {
  const httpClient = accessToken
    ? createAuthedServerHttpClient(accessToken)
    : createServerHttpClient();

  return new ExternalPostRepository(httpClient);
}

export function createGetPostDetailUseCase(
  accessToken: string | null,
): GetPostDetailUseCase {
  return new GetPostDetailUseCase(createReadRepository(accessToken));
}

export function createGetCommentsUseCase(
  accessToken: string | null,
): GetCommentsUseCase {
  return new GetCommentsUseCase(createReadRepository(accessToken));
}

/** 쓰기 use case는 인증 토큰을 강제한다. */
function createWriteRepository(
  accessToken: string,
): ExternalCommunityWriteRepository {
  const httpClient = createAuthedServerHttpClient(accessToken);

  return new ExternalCommunityWriteRepository(httpClient);
}

export function createCreateCommentUseCase(
  accessToken: string,
): CreateCommentUseCase {
  return new CreateCommentUseCase(createWriteRepository(accessToken));
}

export function createDeleteCommentUseCase(
  accessToken: string,
): DeleteCommentUseCase {
  return new DeleteCommentUseCase(createWriteRepository(accessToken));
}

export function createDeletePostUseCase(
  accessToken: string,
): DeletePostUseCase {
  return new DeletePostUseCase(createWriteRepository(accessToken));
}

export function createCreateReportUseCase(
  accessToken: string,
): CreateReportUseCase {
  return new CreateReportUseCase(createWriteRepository(accessToken));
}

export function createToggleLikeUseCase(
  accessToken: string,
): ToggleLikeUseCase {
  return new ToggleLikeUseCase(createWriteRepository(accessToken));
}

export function createToggleCommentLikeUseCase(
  accessToken: string,
): ToggleCommentLikeUseCase {
  return new ToggleCommentLikeUseCase(createWriteRepository(accessToken));
}

export function createToggleBookmarkUseCase(
  accessToken: string,
): ToggleBookmarkUseCase {
  return new ToggleBookmarkUseCase(createWriteRepository(accessToken));
}

export function createGetImageUploadAuthUseCase(
  accessToken: string,
): GetImageUploadAuthUseCase {
  return new GetImageUploadAuthUseCase(createWriteRepository(accessToken));
}

export function createRegisterImageUseCase(
  accessToken: string,
): RegisterImageUseCase {
  return new RegisterImageUseCase(createWriteRepository(accessToken));
}

export function createCreatePostUseCase(
  accessToken: string,
): CreatePostUseCase {
  return new CreatePostUseCase(createWriteRepository(accessToken));
}
