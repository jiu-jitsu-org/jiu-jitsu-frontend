import { DEFAULT_COMMENT_SORT } from "@/features/community/domain/post";
import { PostDetailView } from "@/features/community/presentation/post-detail-view";

import {
  MOCK_COMMENTS_LIST,
  MOCK_POST_BASE,
} from "../detail-playground-data";

/**
 * 게시글 상세 (댓글) 쇼케이스 — 디폴트 하단에 댓글 여러 개가 있는 케이스(초안).
 *
 * 별도 레이아웃 없이, comments.items가 있으면 PostDetailView가 빈 상태 대신 목록을 그린다.
 * 대댓글(중첩)은 제거 — 댓글/대댓글 형태를 합치는 방향이라 현재는 평면 목록만.
 */
export function PostDetailCommentsPlaygroundPage() {
  return (
    <PostDetailView
      post={MOCK_POST_BASE}
      comments={MOCK_COMMENTS_LIST}
      sort={DEFAULT_COMMENT_SORT}
    />
  );
}
