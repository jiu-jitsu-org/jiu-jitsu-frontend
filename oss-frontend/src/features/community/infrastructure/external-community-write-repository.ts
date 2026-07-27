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

  async createComment(postId: number, body: string): Promise<Comment> {
    // POST /community/comments — contentId(게시글 id) + parentId + body.
    // FIXME(대댓글): 현재 화면은 최상위 댓글만 작성하므로 parentId=0 고정.
    //   답글 작성 UI 추가 시 parentId를 인자로 받아 전달.
    const response = await this.httpClient.post<Envelope<CommentDto>>({
      path: COMMENT_ENDPOINT_PATH,
      body: { contentId: postId, parentId: 0, body },
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
}
