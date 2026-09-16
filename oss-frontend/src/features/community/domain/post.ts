/**
 * 커뮤니티 게시글 상세 도메인 타입.
 *
 * 업스트림: GET /board/{id} (게시글 단건 조회) 응답 계약.
 * 프레임워크/인프라에 의존하지 않는 순수 타입만 둔다. (DTO → 이 타입 매핑은 infrastructure가 담당)
 */

export type PostAuthor = {
  /** 작성자 식별자. 단건 조회 응답에 노출되면 매핑, 없으면 0. */
  userId: number;
  nickname: string;
  avatarUrl?: string | null;
};

export type PostTag = {
  id: number;
  name: string;
};

export type PostImage = {
  id: number;
  imageUrl: string;
};

export type PostCounts = {
  /** commentCount */
  comments: number;
  /** likeCount */
  likes: number;
  /** saveCount(저장/북마크 수). */
  saves?: number;
};

/**
 * 게시글에 대한 "내" 상태.
 *
 * FeedCard의 controlled 패턴과 동일 철학 — 상태는 상위(서버에서 주입)가 소유하고,
 * 액션바는 표현만 한 뒤 토글 결과를 콜백으로 위임한다.
 * 비로그인 조회 시 false로 내려온다.
 */
export type PostViewerState = {
  /** isLiked */
  liked: boolean;
  /** isSaved (저장 = 북마크) */
  bookmarked: boolean;
  /** isCommented (내가 댓글을 남겼는지) */
  commented: boolean;
  /** 작성자 본인 여부 — ⋮ 메뉴의 수정/삭제 노출을 결정. */
  isOwner: boolean;
};

export type PostDetail = {
  id: number;
  categoryId: number;
  categoryName: string;
  author: PostAuthor;
  title: string;
  body: string;
  /** imageList */
  images: PostImage[];
  tags: PostTag[];
  counts: PostCounts;
  /** 조회수. 단건 조회 응답에 필드가 있으면 매핑(optional). */
  views?: number;
  viewer: PostViewerState;
  /** createdAt(ISO 8601). */
  createdAt: string;
  /**
   * timeAgo — 서버가 계산한 상대 시각 라벨(예: "8일 전"). 메타행 날짜의 정본.
   * 목록(PostSummary)과 동일 규칙을 쓰려고 서버값을 그대로 노출한다 — 없으면 화면이 createdAt으로 폴백.
   */
  timeAgo?: string;
  /** updatedAt(ISO 8601). */
  updatedAt?: string | null;
  /** isUpdated → "수정됨" 표시 여부. */
  edited: boolean;
  /** noticeEnabled → 이 글의 알림 수신 여부(헤더 종 토글 초기 상태). */
  noticeEnabled: boolean;
};

/** 게시글 카테고리 — GET /board/category 응답 항목(categoryId로 그대로 전송). */
export type PostCategory = {
  id: number;
  name: string;
};

/** 게시글 생성 요청 — POST /board body. */
export type CreatePostInput = {
  categoryId: number;
  title: string;
  body: string;
  /** 등록(TEMP)된 이미지의 서버 int imageId 목록. 표시 순서 = 저장 순서. */
  imageFileIdList: number[];
  /** 태그 이름 목록(Swagger: tags ["BJJ","운동"]). 서버가 공백 제거·소문자·중복 제거를 한 번 더 한다. */
  tags: string[];
};

/**
 * 게시글 수정 화면 초기값 — 상세(PostDetail)에서 편집 가능한 필드만 추린 것.
 * 이미지는 삭제만 가능하므로 id·url만 있으면 되고(PostImage), 태그는 이름만 편집한다.
 */
export type PostEditInitial = {
  categoryId: number;
  title: string;
  body: string;
  images: PostImage[];
  tags: string[];
};

/**
 * 게시글 수정 요청 — PUT /board/{id} body. imageFileIdList는 "남길 이미지 전체" 목록
 * (삭제 = 목록에서 빼기, 서버가 기존 목록을 비우고 이 목록으로 다시 만든다). 수정 화면은 추가·크롭이
 * 없어 상세 imageList[].id(= ImageFile id)를 그대로 보낸다.
 *
 * FIXME(API): 업스트림 BoardUpdateRequest에 tags가 없어 수정으로는 태그를 바꿀 수 없다.
 * 생성(POST /board)과 같은 tags: string[]이 추가되면 함께 전송한다 — 필드는 미리 실어 보낸다(서버는 무시).
 */
export type UpdatePostInput = CreatePostInput;

/** 게시글 생성 결과. 최소한 생성된 글 id를 받는다(상세 이동용). */
export type CreatedPost = {
  id: number;
};

/** 댓글 정렬 기준. 최신순 / 등록순(오래된 순). */
export type CommentSort = "latest" | "oldest";

/** 기본 정렬 — mockup의 "최신순". */
export const DEFAULT_COMMENT_SORT: CommentSort = "latest";

/** 임의 문자열을 안전한 CommentSort로 정규화한다(쿼리스트링 방어). */
export function normalizeCommentSort(value: string | undefined): CommentSort {
  return value === "oldest" ? "oldest" : "latest";
}
