/**
 * 알림에서 연 댓글 번호를 싣는 상세 주소 쿼리(#596).
 *
 * `/community/{글 id}?commentId={댓글 id}` · `/community/balance/{contentId}?commentId={댓글 id}`.
 * 알림함(웹)과 푸시(iOS, jiu-jitsu-ios#436)가 같은 이름을 쓴다 — 바꾸면 iOS도 같이 바꿔야 한다.
 */
export const FOCUSED_COMMENT_PARAM = "commentId";

/** 주소의 commentId를 양의 정수로 푼다. 없거나 잘못된 값이면 null — 상세만 연다. */
export function parseFocusedCommentId(
  value: string | string[] | undefined,
): number | null {
  const commentId = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(commentId) && commentId > 0 ? commentId : null;
}

/** 상세 주소에 댓글 번호를 붙인다. 없으면 그대로. */
export function withFocusedComment(
  path: string,
  commentId?: number | null,
): string {
  if (!commentId) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${FOCUSED_COMMENT_PARAM}=${commentId}`;
}
