/**
 * 커뮤니티 댓글 도메인 타입.
 *
 * 레거시: GET /community/posts/{id}/comments 응답 계약(가정).
 */

import type { PostAuthor } from "@/features/community/domain/post";

/** 댓글 작성자는 게시글 작성자와 동일한 형태를 재사용한다. */
export type CommentAuthor = PostAuthor;

export type Comment = {
  id: number;
  postId: number;
  author: CommentAuthor;
  body: string;
  /** 작성 시각(ISO 8601). */
  createdAt: string;
  /** 작성자 본인 여부 — 삭제 노출 결정. */
  isOwner: boolean;
};

/**
 * 페이지네이션을 포함한 댓글 목록.
 *
 * nextCursor가 null/undefined면 다음 페이지가 없다. (커서 방식 가정 — 백엔드 확인 필요)
 */
export type CommentList = {
  items: Comment[];
  total: number;
  nextCursor?: string | null;
};
