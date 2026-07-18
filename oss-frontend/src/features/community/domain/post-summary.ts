import type {
  PostAuthor,
  PostCounts,
  PostImage,
  PostViewerState,
} from "@/features/community/domain/post";

/**
 * 커뮤니티 게시글 목록 도메인 타입.
 *
 * 업스트림: GET /board (카테고리별·페이징 목록 조회) 응답 계약.
 * 상세(PostDetail)와 작성자/이미지/카운트/viewer 의미는 공유하되, 목록 항목은
 * 조회수·태그·알림설정 등 단건 전용 필드를 갖지 않는다(가벼운 카드 표시용).
 */
export type PostSummary = {
  id: number;
  categoryId: number;
  categoryName: string;
  author: PostAuthor;
  title: string;
  body: string;
  /** imageList. 목록 카드에서는 대표 1장만 노출. */
  images: PostImage[];
  /** likeCount/commentCount. 저장(북마크) 카운트는 응답에 없어 포함하지 않는다. */
  counts: PostCounts;
  viewer: PostViewerState;
  /** createdAt(ISO 8601). */
  createdAt: string;
  /** updatedAt(ISO 8601). */
  updatedAt?: string | null;
  /** isUpdated → "수정됨" 표시 여부. */
  edited: boolean;
};

/**
 * 페이지네이션된 게시글 목록.
 *
 * Spring Page 응답에서 화면이 실제로 쓰는 메타만 추린다(다음 페이지 로드/끝 표식 판단).
 */
export type PostList = {
  items: PostSummary[];
  /** 현재 페이지 번호(0-base). */
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  /** 마지막 페이지 여부 → 피드 끝 표식/추가 로드 중단 판단. */
  isLast: boolean;
};

/**
 * 목록 종류. 명세상 "FEED"만 확인됨 — 종류가 늘면 union에 추가한다.
 * (예: 인기글/공지 등)
 */
export type BoardListType = "FEED";

/**
 * GET /board 요청 파라미터.
 *
 * Spring의 `boardListRequest`/`pageable` 객체 쿼리는 실제 전송 시 평탄한 쿼리스트링으로
 * 펼쳐진다(?boardListType=&categoryId=&searchKeyword=&page=&size=&sort=).
 * categoryId/searchKeyword는 선택값 — 없으면 전체 피드.
 */
export type BoardListQuery = {
  boardListType: BoardListType;
  categoryId?: number;
  searchKeyword?: string;
  /** 0-base 페이지 번호. */
  page: number;
  size: number;
  /** Spring sort 표현(예: "createdAt,desc"). 미지정 시 서버 기본 정렬. */
  sort?: string;
};

/**
 * 메인 피드 페이지당 게시글 수(무한 스크롤 단위).
 *
 * 이미지 포함 카드라 첫 페인트를 가볍게 유지하려 10으로 둔다. 초기 조회(Server Component)와
 * 다음 페이지 조회(BFF GET) 모두 이 값을 공유해 페이지 경계가 어긋나지 않게 한다.
 */
export const FEED_PAGE_SIZE = 10;

/** 메인 피드 기본 쿼리 — 전체 FEED, 첫 페이지. */
export const DEFAULT_BOARD_LIST_QUERY: BoardListQuery = {
  boardListType: "FEED",
  page: 0,
  size: FEED_PAGE_SIZE,
};
