import type { Comment } from "@/features/community/domain/comment";
import {
  type CommentDto,
  toComment,
} from "@/features/community/infrastructure/comment-dto";
import type {
  ImageUploadAuth,
  RegisterImageInput,
  RegisteredImage,
} from "@/features/community/domain/image";
import type {
  CreatePostInput,
  CreatedPost,
} from "@/features/community/domain/post";
import type { CommunityWriteRepository } from "@/features/community/domain/post-repository";
import type { CreateReportInput } from "@/features/community/domain/report";
import type { HttpClient } from "@/shared/lib/http";

/**
 * 업스트림 커뮤니티 쓰기 API를 사용하는 infrastructure 구현.
 *
 * 모든 쓰기는 인증이 필요하므로 주입되는 HttpClient는 반드시 authed(Bearer 부착) 클라이언트다.
 *
 * 댓글 생성은 Swagger 확정 계약(POST /community/comments, body { contentId, parentId, body }).
 * 대댓글은 parentId에 부모 댓글 id를 넣어 같은 엔드포인트로 보낸다.
 * 게시글 삭제는 Swagger 확정 계약(DELETE /board/{id}) — 200 OK, 응답 본문은 사용하지 않는다.
 * 좋아요는 Swagger 확정 계약(PUT /board/like/{id}) — 서버가 토글하고 isLiked를 돌려준다.
 * 저장(북마크)은 Swagger 확정 계약(PUT /board/save/{id}) — 서버가 토글하고 isSaved를 돌려준다.
 *
 * FIXME: 이미지 경로는 가정 계약이다(Swagger 미확인). 백엔드 확정 시 정합 확인 필요.
 */
const BOARD_ENDPOINT_PATH = "/api/board";
const IMAGE_ENDPOINT_PATH = "/api/image";
const COMMENT_ENDPOINT_PATH = "/api/community/comments";
const REPORT_ENDPOINT_PATH = "/api/reports";
const USER_ENDPOINT_PATH = "/api/user";

type Envelope<T> = {
  success: boolean;
  code: string;
  message: string;
  data: T;
};

export class ExternalCommunityWriteRepository
  implements CommunityWriteRepository
{
  constructor(private readonly httpClient: HttpClient) {}

  async createComment(
    postId: number,
    body: string,
    parentId?: number,
  ): Promise<Comment> {
    // POST /community/comments — contentId(게시글 id) + parentId + body.
    // 최상위 댓글은 업스트림 규약상 parentId=0으로 보낸다(null 아님).
    const response = await this.httpClient.post<Envelope<CommentDto>>({
      path: COMMENT_ENDPOINT_PATH,
      body: { contentId: postId, parentId: parentId ?? 0, body },
    });

    return toComment(response.data);
  }

  async deleteComment(commentId: number): Promise<void> {
    // DELETE /community/comments/{id} — 본인 댓글 삭제. 응답 본문은 사용하지 않는다.
    await this.httpClient.delete<Envelope<null>>({
      path: `${COMMENT_ENDPOINT_PATH}/${commentId}`,
    });
  }

  async deletePost(postId: number): Promise<void> {
    // DELETE /board/{id} — 본인 게시글 삭제. 응답 본문은 사용하지 않는다.
    await this.httpClient.delete<Envelope<null>>({
      path: `${BOARD_ENDPOINT_PATH}/${postId}`,
    });
  }

  async report(input: CreateReportInput): Promise<void> {
    // POST /reports — { reportType, targetId, reason }. 응답 본문은 사용하지 않는다.
    // 동일 대상 중복 신고는 서버가 막는다(409 가정) → HttpError로 상위에 전달.
    await this.httpClient.post<Envelope<null>>({
      path: REPORT_ENDPOINT_PATH,
      body: input,
    });
  }

  async toggleCommentLike(commentId: number): Promise<boolean> {
    // POST /community/comments/like — 단일 엔드포인트 토글(등록/취소). 응답 data.isLiked가 토글 후 상태.
    const response = await this.httpClient.post<
      Envelope<{ commentId: number; isLiked: boolean }>
    >({
      path: `${COMMENT_ENDPOINT_PATH}/like`,
      body: { commentId },
    });

    return response.data.isLiked;
  }

  async toggleLike(postId: number): Promise<boolean> {
    // PUT /board/like/{id} — 단일 엔드포인트 토글(등록/취소). 응답 data.isLiked가 토글 후 상태.
    const response = await this.httpClient.put<
      Envelope<{ contentID: number; isLiked: boolean }>
    >({
      path: `${BOARD_ENDPOINT_PATH}/like/${postId}`,
    });

    return response.data.isLiked;
  }

  async toggleSave(postId: number): Promise<boolean> {
    // PUT /board/save/{id} — 단일 엔드포인트 토글(저장/취소). 응답 data.isSaved가 토글 후 상태.
    const response = await this.httpClient.put<
      Envelope<{ contentID: number; isSaved: boolean }>
    >({
      path: `${BOARD_ENDPOINT_PATH}/save/${postId}`,
    });

    return response.data.isSaved;
  }

  async toggleHide(postId: number): Promise<boolean> {
    // PUT /board/hide/{id} — 단일 엔드포인트 토글(숨김/숨김해제).
    // 좋아요·저장과 달리 Swagger 응답 예시가 봉투 없는 raw `true`라, 두 형태를 모두 허용한다
    // (봉투가 오면 data를, 아니면 본문 자체를 토글 후 상태로 읽는다).
    const response = await this.httpClient.put<
      Envelope<{ contentID: number; isHidden?: boolean }> | boolean
    >({
      path: `${BOARD_ENDPOINT_PATH}/hide/${postId}`,
    });

    if (typeof response === "boolean") return response;
    return response.data?.isHidden ?? true;
  }

  async getImageUploadAuth(): Promise<ImageUploadAuth> {
    const response = await this.httpClient.get<Envelope<ImageUploadAuth>>({
      path: `${IMAGE_ENDPOINT_PATH}/auth`,
    });

    return response.data;
  }

  async registerImage(input: RegisterImageInput): Promise<RegisteredImage> {
    const response = await this.httpClient.post<Envelope<RegisteredImage>>({
      path: IMAGE_ENDPOINT_PATH,
      body: input,
    });

    return response.data;
  }

  async createPost(input: CreatePostInput): Promise<CreatedPost> {
    const response = await this.httpClient.post<Envelope<CreatedPost>>({
      path: BOARD_ENDPOINT_PATH,
      body: input,
    });

    return response.data;
  }

  async toggleBlock(userId: number): Promise<boolean> {
    // POST /user/block/{id} — 단일 엔드포인트 토글(차단/차단해제). 대상은 댓글이 아니라 작성자 회원이다.
    //
    // 응답은 다른 토글(좋아요/저장)처럼 data가 객체가 아니라 boolean 그 자체다
    // (실측: {"success":true,...,"data":true}). Swagger 스키마는 봉투 없는 raw boolean으로
    // 적혀 있어 실제와 다르므로, 둘 다 토글 후 상태로 읽는다.
    const response = await this.httpClient.post<Envelope<boolean> | boolean>({
      path: `${USER_ENDPOINT_PATH}/block/${userId}`,
    });

    return typeof response === "boolean" ? response : response.data;
  }
}
