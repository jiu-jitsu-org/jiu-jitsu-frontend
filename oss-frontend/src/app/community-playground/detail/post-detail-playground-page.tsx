import { DEFAULT_COMMENT_SORT } from "@/features/community/domain/post";
import { PostDetailView } from "@/features/community/presentation/post-detail-view";

import { MOCK_COMMENTS_EMPTY, MOCK_POST_BASE } from "./detail-playground-data";

/**
 * 게시글 상세 (디폴트) 쇼케이스 — 이미지/댓글 없는 베이스 mock.
 *
 * 백엔드 커뮤니티 API 준비 전 UI/레이아웃과 클라이언트 인터랙션(정렬·낙관적 토글·공유)을
 * 격리 검증한다. 실제 화면(PostDetailScreen)과 동일한 PostDetailView를 공유한다.
 */
export function PostDetailPlaygroundPage() {
  return (
    <PostDetailView
      post={MOCK_POST_BASE}
      comments={MOCK_COMMENTS_EMPTY}
      sort={DEFAULT_COMMENT_SORT}
    />
  );
}
