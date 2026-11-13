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
  /** 작성 시각(ISO 8601, 오프셋 명시). 화면이 공통 규칙으로 상대 시간을 계산한다(#188). */
  createdAt: string;
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
  /**
   * 내가 차단한 회원의 댓글인지 — 신고와 같이 차단한 계정 화면에서만 true.
   * 차단 대상은 댓글 1건이 아니라 작성자 회원이라, 그 회원의 댓글·대댓글이 모두 가려진다.
   * 게시글은 목록·상세에서 아예 빠지지만 댓글은 자리를 남긴다 — 걷어내면 대댓글이 부모를 잃는다.
   */
  isBlocked: boolean;
  /** 대댓글 목록(같은 Comment 형태, 1단계 중첩). 없으면 빈 배열. */
  replies: Comment[];
};

/**
 * 대댓글 추가 조회 한 페이지(backend#115).
 *
 * 서버가 Spring Slice로 내려줘 총 개수가 없다 — "다음 페이지가 있는지"만 알 수 있다.
 * 「대댓글 더보기」는 개수를 표기하지 않는 정책(#62)이라 이 정보로 충분하다.
 */
export type ReplyPage = {
  items: Comment[];
  hasNext: boolean;
};

/**
 * 최상위 댓글 목록 한 페이지(backend#161, 20개씩).
 *
 * 대댓글 추가 조회와 같은 Spring Slice라 총 개수 없이 다음 페이지 여부만 온다. 댓글 수는
 * 상세 응답(commentCount)이 따로 준다. 각 댓글에는 대댓글 미리보기 3개가 딸려 온다(backend#111).
 */
export type CommentList = {
  items: Comment[];
  hasNext: boolean;
};

/**
 * 게시글 작성자가 쓴 댓글에 isPostAuthor=true를 채운다("작성자" 배지).
 *
 * 응답에 "댓글 작성자 == 게시글 작성자" 필드가 없어, 게시글 author id와 댓글 author id를
 * 비교해 도출한다. 대댓글까지 재귀 적용. 상세 SSR과 무한 스크롤로 이어 받은 페이지가
 * 같은 규칙을 써야 배지가 어긋나지 않는다. 밸런스 게임처럼 작성자가 없으면 그대로 둔다.
 */
export function markPostAuthorComments(
  comments: Comment[],
  postAuthorId: number | null | undefined,
): Comment[] {
  if (!postAuthorId) return comments;

  return comments.map((comment) => ({
    ...comment,
    isPostAuthor: comment.author.userId === postAuthorId,
    replies: markPostAuthorComments(comment.replies, postAuthorId),
  }));
}
