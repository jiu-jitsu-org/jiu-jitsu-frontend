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
  /**
   * timeAgo — 서버가 계산한 상대 시각 라벨(예: "8일 전"). 게시글과 동일하게 이게 날짜의 정본이다.
   * 아직 댓글 응답에 내려오지 않아 optional — 들어오면 그대로 노출하고, 없으면 화면이 createdAt으로 폴백한다.
   */
  timeAgo?: string;
  /** 내 댓글 여부 — 삭제 노출 결정. */
  isOwner: boolean;
  /** 게시글 작성자가 쓴 댓글인지 — "작성자" 배지 표시. */
  isPostAuthor: boolean;
  /** 좋아요 수 / 내가 좋아요 했는지. */
  likeCount: number;
  liked: boolean;
  /** 이 댓글에 달린 답글 수(💬 카운트). */
  replyCount: number;
  /** 내가 이 댓글에 답글을 단 적 있는지 — 답글 아이콘 fill 표시. */
  replied: boolean;
  /**
   * 삭제된 댓글인지 — 신고와 달리 계정별로 갈리지 않고 모두에게 동일하게 내려온다.
   * 삭제돼도 목록에서 빼지 않고 자리만 남긴다 — 걷어내면 아래 대댓글이 부모를 잃는다.
   * (게시글은 반대로 목록·상세에서 완전히 제거된다 — #41.)
   */
  isDeleted: boolean;
  /**
   * 내가 신고한 댓글인지 — 신고자 본인 화면에서만 true.
   * 신고해도 콘텐츠는 서버에 유지되고 타 사용자에겐 정상 노출되므로, 가림 여부는 계정별로 갈린다.
   */
  isReported: boolean;
  /** 대댓글 목록(같은 Comment 형태, 1단계 중첩). 없으면 빈 배열. */
  replies: Comment[];
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
