import type { CommentList } from "@/features/community/domain/comment";
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
  counts: { comments: 0, likes: 0 },
  views: 0,
  // 활성(좋아요/북마크) 상태 디자인 확인용으로 true.
  viewer: { liked: true, bookmarked: true, commented: false, isOwner: false },
  createdAt: "2025-09-18T16:15:00+09:00",
  updatedAt: "2025-09-18T17:00:00+09:00",
  edited: true,
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
