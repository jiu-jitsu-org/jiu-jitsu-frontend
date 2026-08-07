import type { CommentList } from "@/features/community/domain/comment";
import type {
  CommentSort,
  PostDetail,
} from "@/features/community/domain/post";
import type { PostRepository } from "@/features/community/domain/post-repository";
import type {
  BoardListQuery,
  PostList,
  PostSummary,
} from "@/features/community/domain/post-summary";
import {
  type CommentDto,
  toComment,
} from "@/features/community/infrastructure/comment-dto";
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
 *
 * 댓글 목록: GET /community/comments?id={게시글id}&sortType=CREATE_DESC|CREATE_ASC.
 *   응답 봉투 data는 댓글 DTO 평배열이라 toComment로 매핑해 CommentList로 조립한다(서버 페이지네이션 없음).
 */
const BOARD_ENDPOINT_PATH = "/api/board";
const COMMENT_ENDPOINT_PATH = "/api/community/comments";

/** 도메인 정렬 → 업스트림 sortType 쿼리 값. */
const COMMENT_SORT_TYPE: Record<CommentSort, string> = {
  latest: "CREATE_DESC",
  oldest: "CREATE_ASC",
};

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

/**
 * GET /board content[] 항목 DTO.
 *
 * 상세(BoardDetailDto)와 달리 알림설정(noticeEnabled)이 없고, 목록 전용 필드(timeAgo)가 있다.
 * 아래 필드는 응답에는 오지만 아직 도메인/화면에서 쓰지 않는다 — 계약을 먼저 고정해 둔다:
 *   viewCount(조회수) · tags(태그) · categoryName · updatedAt.
 */
type BoardSummaryDto = {
  id: number;
  categoryId: number;
  categoryName: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt?: string | null;
  /** 응답에서 누락되는 경우가 있어 optional — 매핑 시 false로 정규화. */
  isUpdated?: boolean;
  commentCount: number;
  likeCount: number;
  /** 저장(북마크) 수. 구버전 응답 호환을 위해 optional로 두고 매핑 시 0으로 정규화. */
  saveCount?: number;
  /** 조회수. 목록 카드 노출 스펙은 미확정(이전 표시 시도는 롤백됨). */
  viewCount?: number;
  /** 태그 목록. 상세의 tagList와 키 이름이 다르다(목록은 tags). 항목 형태는 상세와 동일 가정. */
  tags?: { id: number; name: string }[];
  /** 서버가 계산한 상대 시각(예: "10일 전"). 카드 날짜 라벨의 정본 — 없으면 createdAt으로 폴백. */
  timeAgo?: string;
  isCommented: boolean;
  isLiked: boolean;
  isSaved: boolean;
  imageList: { id: number; imageUrl: string }[];
  author: {
    id: number;
    nickname: string;
    profileImage: { id: number; imageUrl: string } | null;
  };
  isAuthor: boolean;
};

/** GET /board 성공 응답 DTO(봉투 data 안의 Spring Page 형태). 화면이 쓰는 메타만 선언. */
type BoardListDto = {
  content: BoardSummaryDto[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  last: boolean;
};

function toPostSummary(dto: BoardSummaryDto): PostSummary {
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
    counts: {
      comments: dto.commentCount,
      likes: dto.likeCount,
      saves: dto.saveCount ?? 0,
    },
    viewer: {
      liked: dto.isLiked,
      bookmarked: dto.isSaved,
      commented: dto.isCommented,
      isOwner: dto.isAuthor,
    },
    createdAt: dto.createdAt,
    timeAgo: dto.timeAgo,
    updatedAt: dto.updatedAt ?? null,
    edited: dto.isUpdated ?? false,
  };
}

function toPostList(dto: BoardListDto): PostList {
  return {
    items: (dto.content ?? []).map(toPostSummary),
    page: dto.number,
    size: dto.size,
    totalElements: dto.totalElements,
    totalPages: dto.totalPages,
    isLast: dto.last,
  };
}

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

  async getPostList(query: BoardListQuery): Promise<PostList> {
    // Spring 객체 쿼리(boardListRequest/pageable)는 평탄한 쿼리스트링으로 펼쳐 전송한다.
    // undefined 값(categoryId/searchKeyword/sort)은 HttpClient가 알아서 생략한다.
    const response = await this.httpClient.get<Envelope<BoardListDto>>({
      path: BOARD_ENDPOINT_PATH,
      query: {
        boardListType: query.boardListType,
        categoryId: query.categoryId,
        searchKeyword: query.searchKeyword,
        page: query.page,
        size: query.size,
        sort: query.sort,
      },
    });

    return toPostList(response.data);
  }

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
  ): Promise<CommentList> {
    // GET /community/comments?id=&sortType= → 봉투 data는 댓글 DTO 평배열.
    const response = await this.httpClient.get<Envelope<CommentDto[]>>({
      path: COMMENT_ENDPOINT_PATH,
      query: { id: postId, sortType: COMMENT_SORT_TYPE[sort] },
    });

    const items = (response.data ?? []).map(toComment);
    // 서버 커서 페이지네이션 미제공 — 전체 목록을 한 번에 반환한다.
    return { items, total: items.length, nextCursor: null };
  }
}
