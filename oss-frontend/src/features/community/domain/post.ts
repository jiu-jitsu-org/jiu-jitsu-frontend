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
  /** updatedAt(ISO 8601). */
  updatedAt?: string | null;
  /** isUpdated → "수정됨" 표시 여부. */
  edited: boolean;
};

/** 댓글 정렬 기준. 최신순 / 등록순(오래된 순). */
export type CommentSort = "latest" | "oldest";

/** 기본 정렬 — mockup의 "최신순". */
export const DEFAULT_COMMENT_SORT: CommentSort = "latest";

/** 임의 문자열을 안전한 CommentSort로 정규화한다(쿼리스트링 방어). */
export function normalizeCommentSort(value: string | undefined): CommentSort {
  return value === "oldest" ? "oldest" : "latest";
}
