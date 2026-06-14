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
import type { HttpClient } from "@/shared/lib/http";

/**
 * 업스트림 커뮤니티 쓰기 API를 사용하는 infrastructure 구현.
 *
 * 모든 쓰기는 인증이 필요하므로 주입되는 HttpClient는 반드시 authed(Bearer 부착) 클라이언트다.
 *
 * 댓글 생성은 Swagger 확정 계약(POST /community/comments, body { contentId, parentId, body }).
 * 좋아요/북마크는 POST(추가) / DELETE(취소)로 토글한다. 멱등 동작이라 본문은 무시한다.
 * 북마크는 단건 조회 응답의 `isSaved`에 맞춰 `/saves` 경로를 가정한다.
 *
 * FIXME: board/이미지/좋아요·북마크 경로는 가정 계약이다(Swagger 미확인). 백엔드 확정 시 정합 확인 필요.
 */
const BOARD_ENDPOINT_PATH = "/api/board";
const IMAGE_ENDPOINT_PATH = "/api/image";
const COMMENT_ENDPOINT_PATH = "/api/community/comments";

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

  async likePost(postId: number): Promise<void> {
    await this.httpClient.post<Envelope<null>>({
      path: `${BOARD_ENDPOINT_PATH}/${postId}/likes`,
    });
  }

  async unlikePost(postId: number): Promise<void> {
    await this.httpClient.delete<Envelope<null>>({
      path: `${BOARD_ENDPOINT_PATH}/${postId}/likes`,
    });
  }

  async bookmarkPost(postId: number): Promise<void> {
    await this.httpClient.post<Envelope<null>>({
      path: `${BOARD_ENDPOINT_PATH}/${postId}/saves`,
    });
  }

  async unbookmarkPost(postId: number): Promise<void> {
    await this.httpClient.delete<Envelope<null>>({
      path: `${BOARD_ENDPOINT_PATH}/${postId}/saves`,
    });
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
