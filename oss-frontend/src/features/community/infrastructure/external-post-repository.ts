import type { CommentList } from "@/features/community/domain/comment";
import type {
  CommentSort,
  PostDetail,
} from "@/features/community/domain/post";
import type { PostRepository } from "@/features/community/domain/post-repository";
import type { HttpClient } from "@/shared/lib/http";

/**
 * 업스트림 커뮤니티 읽기 API를 사용하는 infrastructure 구현.
 *
 * viewer(isLiked/isSaved/isCommented) 상태는 주입된 HttpClient에 Authorization 헤더가
 * 있을 때 업스트림이 채워준다. 비로그인(unauthed client)이면 false로 내려온다.
 *
 * 경로 prefix `/api`: 업스트림은 {API_BASE_URL}/api/... 아래에 라우트가 있다.
 * (profile의 "/api/user/profile"과 동일 규칙. Swagger의 /board/{id}는 base가 이미 /api 포함)
 *
 * 응답 봉투: 이 백엔드는 모든 응답을 { success, code, message, data }로 감싼다(profile 동일 규칙).
 * Swagger의 Example Value는 봉투 안 `data` DTO만 보여준다. 실제 페이로드를 한 겹 벗겨 매핑한다.
 *
 * FIXME: 댓글 목록 경로/쿼리는 가정 계약이다. 백엔드 Swagger 확정 시 정합 확인 필요.
 * FIXME: 단건 조회 응답에서 작성자(닉네임/프로필)·조회수·태그·isOwner 필드가 미확인 →
 *        DTO에 optional로 두고 매핑(없으면 기본값). 실제 필드명 확인 시 보정.
 */
const BOARD_ENDPOINT_PATH = "/api/board";

type Envelope<T> = {
  success: boolean;
  code: string;
  message: string;
  data: T;
};

/** GET /board/{id} 응답 DTO(확인된 필드 + 미확인 추정 필드는 optional). */
type BoardDetailDto = {
  id: number;
  categoryId: number;
  categoryName: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt?: string | null;
  isUpdated: boolean;
  commentCount: number;
  likeCount: number;
  isCommented: boolean;
  isLiked: boolean;
  isSaved: boolean;
  imageList: { id: number; imageUrl: string }[];
  // ↓ Swagger 화면에서 미확인 — 응답에 있으면 매핑되도록 optional로 선언.
  writerId?: number;
  writerNickname?: string;
  writerProfileImageUrl?: string | null;
  viewCount?: number;
  tagList?: { id: number; name: string }[];
  isOwner?: boolean;
};

function toPostDetail(dto: BoardDetailDto): PostDetail {
  return {
    id: dto.id,
    categoryId: dto.categoryId,
    categoryName: dto.categoryName,
    author: {
      userId: dto.writerId ?? 0,
      nickname: dto.writerNickname ?? "",
      avatarUrl: dto.writerProfileImageUrl ?? null,
    },
    title: dto.title,
    body: dto.body,
    images: dto.imageList ?? [],
    tags: dto.tagList ?? [],
    counts: {
      comments: dto.commentCount,
      likes: dto.likeCount,
    },
    views: dto.viewCount,
    viewer: {
      liked: dto.isLiked,
      bookmarked: dto.isSaved,
      commented: dto.isCommented,
      isOwner: dto.isOwner ?? false,
    },
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt ?? null,
    edited: dto.isUpdated,
  };
}

export class ExternalPostRepository implements PostRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async getPostDetail(postId: number): Promise<PostDetail> {
    const response = await this.httpClient.get<Envelope<BoardDetailDto>>({
      path: `${BOARD_ENDPOINT_PATH}/${postId}`,
    });

    return toPostDetail(response.data);
  }

  async getComments(
    postId: number,
    sort: CommentSort,
    cursor?: string,
  ): Promise<CommentList> {
    const response = await this.httpClient.get<Envelope<CommentList>>({
      path: `${BOARD_ENDPOINT_PATH}/${postId}/comments`,
      query: { sort, cursor },
    });

    return response.data;
  }
}
