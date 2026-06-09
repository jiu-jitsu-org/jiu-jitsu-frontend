import { DEFAULT_COMMENT_SORT } from "@/features/community/domain/post";
import { PostDetailView } from "@/features/community/presentation/post-detail-view";

import { MOCK_COMMENTS_EMPTY, MOCK_POST_BASE } from "./detail-playground-data";

/**
 * 게시글 상세 (디폴트) 쇼케이스 — 이미지/댓글 없는 베이스 mock.
 *
 * 백엔드 커뮤니티 API 준비 전 UI/레이아웃과 클라이언트 인터랙션(정렬·낙관적 토글·공유)을
 * 격리 검증한다. 실제 화면(PostDetailScreen)과 동일한 PostDetailView를 공유한다.
 */
export function PostDetailPlaygroundPage({
  isOwner = false,
}: {
  /** 내 게시글 여부 — 헤더 ⋮ 메뉴(삭제/수정 vs 신고/숨기기)를 시연하기 위한 토글. */
  isOwner?: boolean;
}) {
  const post = {
    ...MOCK_POST_BASE,
    viewer: { ...MOCK_POST_BASE.viewer, isOwner },
  };

  return (
    <PostDetailView
      post={post}
      comments={MOCK_COMMENTS_EMPTY}
      sort={DEFAULT_COMMENT_SORT}
    />
  );
}
