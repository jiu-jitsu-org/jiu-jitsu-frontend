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
 * (Swagger의 /board/{id}는 base가 이미 /api 포함)
 *
 * 응답 봉투: 이 백엔드는 모든 응답을 { success, code, message, data }로 감싼다(성공/에러 공통).
 * 성공 시 실제 페이로드는 data 안에 있으므로 한 겹 벗겨 매핑한다. 에러(success:false)의 code 분기는
 * 공통 ApiError(toApiError)가 처리한다.
 *
 * 작성자(author)·isAuthor(본인 여부)는 응답에 포함된다. 조회수·태그 필드는 아직 없어 optional.
 * FIXME: 댓글 목록 경로/봉투는 미확정(가정). 댓글 API 연동 시 정합 확인 필요.
 */
const BOARD_ENDPOINT_PATH = "/api/board";

type Envelope<T> = {
  success: boolean;
  code: string;
  message: string;
  data: T;
};

/** GET /board/{id} 성공 응답 DTO(봉투 data 안의 형태). */
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
  /** 미설정이면 null로 오므로 매핑 시 false로 정규화. */
  noticeEnabled: boolean | null;
  author: {
    id: number;
    nickname: string;
    /** 프로필 이미지(없으면 null). 객체 형태 { id, imageUrl }. */
    profileImage: { id: number; imageUrl: string } | null;
  };
  /** 본인 게시글 여부(viewer.isOwner). */
  isAuthor: boolean;
  // ↓ 응답에 아직 없음. 추가되면 매핑되도록 optional.
  viewCount?: number;
  tagList?: { id: number; name: string }[];
};

function toPostDetail(dto: BoardDetailDto): PostDetail {
  return {
    id: dto.id,
    categoryId: dto.categoryId,
    categoryName: dto.categoryName,
    author: {
      userId: dto.author.id,
      nickname: dto.author.nickname,
      avatarUrl: dto.author.profileImage?.imageUrl ?? null,
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
      isOwner: dto.isAuthor,
    },
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt ?? null,
    edited: dto.isUpdated,
    noticeEnabled: dto.noticeEnabled ?? false,
  };
}

export class ExternalPostRepository implements PostRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async getPostDetail(postId: number): Promise<PostDetail> {
    // 성공 응답은 { ..., data: BoardDetailDto } 봉투 → data를 한 겹 벗긴다.
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
