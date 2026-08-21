import type { Comment, CommentList } from "@/features/community/domain/comment";
import type { PostDetail, PostImage } from "@/features/community/domain/post";

/**
 * 게시글 상세 쇼케이스 공용 mock 데이터.
 * 타입별 변형(디폴트/사진/…)이 이 베이스를 재사용하고 일부만 덮어쓴다.
 */

/** 베이스 게시글 — 이미지 없음(디폴트). */
export const MOCK_POST_BASE: PostDetail = {
  id: 1,
  categoryId: 1,
  categoryName: "자유게시판",
  author: { userId: 10, nickname: "안녕안녕" },
  title: "제목 제목 제목 제목 제목 제목 제목 제목 제목 제목 제목 제목",
  body: "본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문\n본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문",
  images: [],
  tags: [
    { id: 1, name: "드릴" },
    { id: 2, name: "서브미션" },
    { id: 3, name: "드릴2" },
  ],
  counts: { comments: 0, likes: 0, saves: 1 },
  views: 0,
  // 활성(좋아요/북마크/댓글) 상태 디자인 확인용으로 true. shared는 서버 미제공 기본값 그대로 false.
  viewer: {
    liked: true,
    bookmarked: true,
    commented: true,
    shared: false,
    isOwner: false,
  },
  createdAt: "2025-09-18T16:15:00+09:00",
  updatedAt: "2025-09-18T17:00:00+09:00",
  edited: true,
  noticeEnabled: true,
};

/** 댓글 없음(빈 상태). */
export const MOCK_COMMENTS_EMPTY: CommentList = {
  items: [],
  total: 0,
  nextCursor: null,
};

/** 사진 변형용 이미지(여러 장 → 대표 1장만 노출, +N은 임시 숨김). */
export const MOCK_IMAGES: PostImage[] = [
  { id: 1, imageUrl: "https://picsum.photos/seed/oss-detail-1/800/450" },
  { id: 2, imageUrl: "https://picsum.photos/seed/oss-detail-2/800/450" },
  { id: 3, imageUrl: "https://picsum.photos/seed/oss-detail-3/800/450" },
];

const COMMENT_BODY =
  "본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문";

/** 대댓글 한 건 생성(같은 Comment 형태, 더 중첩하지 않음 → replies: []). */
function makeReply(id: number): Comment {
  return {
    id,
    postId: 1,
    author: { userId: 20 + id, nickname: "안녕안녕" },
    body: COMMENT_BODY,
    createdAt: "2026-02-14T11:00:00+09:00",
    isOwner: false,
    isPostAuthor: false,
    likeCount: 0,
    liked: false,
    replyCount: 1,
    replied: false,
    replies: [],
  };
}

/** 댓글 변형용 — 여러 개 댓글(초안: 카운트/작성자 배지/좋아요 상태/대댓글 다양화). */
const MOCK_COMMENT_ITEMS: Comment[] = [
  {
    id: 1,
    postId: 1,
    author: { userId: 10, nickname: "안녕안녕" },
    body: COMMENT_BODY,
    createdAt: "2026-02-14T10:00:00+09:00",
    // 내 댓글 케이스 → ⋮ 메뉴에 "삭제" 노출
    isOwner: true,
    isPostAuthor: false,
    likeCount: 0,
    liked: false,
    replyCount: 0,
    replied: false,
    replies: [],
  },
  {
    id: 2,
    postId: 1,
    author: { userId: 11, nickname: "안녕안녕" },
    body: COMMENT_BODY,
    createdAt: "2026-02-14T10:05:00+09:00",
    isOwner: false,
    isPostAuthor: false,
    // 좋아요 있음 + 내가 안 누른 경우(state 2): 빈 하트 + 카운트
    likeCount: 2,
    liked: false,
    replyCount: 1,
    replied: false,
    replies: [],
  },
  {
    id: 3,
    postId: 1,
    author: { userId: 12, nickname: "안녕안녕" },
    body: COMMENT_BODY,
    createdAt: "2026-02-14T10:10:00+09:00",
    isOwner: false,
    isPostAuthor: false,
    likeCount: 4,
    liked: true,
    replyCount: 1,
    replied: false,
    replies: [],
  },
  {
    id: 4,
    postId: 1,
    author: { userId: 10, nickname: "안녕안녕" },
    body: COMMENT_BODY,
    createdAt: "2026-02-14T10:15:00+09:00",
    isOwner: false,
    isPostAuthor: true,
    likeCount: 0,
    liked: false,
    replyCount: 4,
    // 내가 단 대댓글이 있는 케이스 → 답글 아이콘 fill + 카운트
    replied: true,
    // 대댓글 4개 → 최초 2개 노출 + "대댓글 2개 더보기"
    replies: [makeReply(101), makeReply(102), makeReply(103), makeReply(104)],
  },
];

export const MOCK_COMMENTS_LIST: CommentList = {
  items: MOCK_COMMENT_ITEMS,
  total: MOCK_COMMENT_ITEMS.length,
  nextCursor: null,
};
