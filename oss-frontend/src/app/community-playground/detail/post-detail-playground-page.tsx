import type { CommentList } from "@/features/community/domain/comment";
import type { PostDetail } from "@/features/community/domain/post";
import { DEFAULT_COMMENT_SORT } from "@/features/community/domain/post";
import { PostDetailView } from "@/features/community/presentation/post-detail-view";

/**
 * 게시글 상세 화면 쇼케이스 (개발용, mock 데이터).
 *
 * 백엔드 커뮤니티 API 준비 전 UI/레이아웃과 클라이언트 인터랙션(정렬·낙관적 토글·공유)을
 * 격리 검증한다. 쓰기 fetch는 실제 BFF로 가지만 업스트림이 없으면 실패→롤백된다(시각 확인용).
 * (community-playground가 FeedCard를 mock으로 보여주는 것과 동일 취지)
 */

const MOCK_POST: PostDetail = {
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
  // 활성(좋아요/북마크) 상태 디자인 확인용으로 true. 기본값 확인 시 false로.
  viewer: { liked: true, bookmarked: true, commented: false, isOwner: false },
  createdAt: "2025-09-18T16:15:00+09:00",
  updatedAt: "2025-09-18T17:00:00+09:00",
  edited: true,
};

const MOCK_COMMENTS: CommentList = {
  items: [],
  total: 0,
  nextCursor: null,
};

export function PostDetailPlaygroundPage() {
  return (
    <PostDetailView
      post={MOCK_POST}
      comments={MOCK_COMMENTS}
      sort={DEFAULT_COMMENT_SORT}
    />
  );
}
