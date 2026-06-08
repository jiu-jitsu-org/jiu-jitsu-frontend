import type { Comment } from "@/features/community/domain/comment";
import type { CommunityWriteRepository } from "@/features/community/domain/post-repository";
import type { HttpClient } from "@/shared/lib/http";

/**
 * 업스트림 커뮤니티 쓰기 API를 사용하는 infrastructure 구현.
 *
 * 모든 쓰기는 인증이 필요하므로 주입되는 HttpClient는 반드시 authed(Bearer 부착) 클라이언트다.
 *
 * 좋아요/북마크는 POST(추가) / DELETE(취소)로 토글한다. 멱등 동작이라 본문은 무시한다.
 * 북마크는 단건 조회 응답의 `isSaved`에 맞춰 `/saves` 경로를 가정한다.
 *
 * FIXME: 아래 경로/본문 필드(`content`)는 가정 계약이다(단건 조회 외 엔드포인트는 Swagger 미확인).
 *        백엔드 확정 시 정합 확인 필요.
 */
const BOARD_ENDPOINT_PATH = "/api/board";

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
    const response = await this.httpClient.post<Envelope<Comment>>({
      path: `${BOARD_ENDPOINT_PATH}/${postId}/comments`,
      body: { content: body },
    });

    return response.data;
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
}
