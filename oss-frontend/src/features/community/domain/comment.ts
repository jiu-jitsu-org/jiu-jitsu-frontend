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
 * 알림에서 연 댓글 묶음(GET /community/comments/{id}, backend#271).
 *
 * 알림 · 푸시의 commentId로 그 댓글을 목록 맨 위에 먼저 보여 준다(#596) — 댓글이 20개씩 더보기라
 * 21번째 이후 댓글은 목록만으로는 바로 안 보인다.
 * - 댓글이면 comment = 그 댓글, reply = null
 * - 대댓글이면 comment = 원 댓글, reply = 그 대댓글(미리보기 3개 밖이어도 온다)
 * comment는 목록 항목과 같은 모양이라 대댓글 미리보기 3개 · 대댓글 수가 딸려 온다.
 */
export type CommentThread = {
  /** 댓글이 달린 컨텐츠(게시글 · 밸런스 게임) id — 주소의 글과 다르면 쓰지 않는다. */
  contentId: number;
  comment: Comment;
  reply: Comment | null;
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

/**
 * 알림에서 연 묶음을 목록 한 줄로 — 대댓글이면 원 댓글의 대댓글에 그 대댓글을 더한다(#596).
 *
 * 미리보기 3개 밖의 대댓글도 원 댓글 아래에서 보여야 해 미리보기 뒤에 붙인다. 미리보기 안에 이미 있으면
 * 한 번만 둔다. 대댓글 묶음은 늘 단 순서로 줄 세우고(CommentReplies) 「대댓글 더보기」로 받은 같은 id도
 * 한 번만 그리므로 붙인 자리는 상관없다.
 */
export function focusedThreadComment(thread: CommentThread): Comment {
  const { comment, reply } = thread;
  if (!reply || comment.replies.some((item) => item.id === reply.id)) {
    return comment;
  }
  return { ...comment, replies: [...comment.replies, reply] };
}
