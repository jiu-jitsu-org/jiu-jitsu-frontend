import type {
  InboxNotification,
  InboxNotificationType,
} from "@/features/community/domain/inbox-notification";

/**
 * 알림함 문구 — 알림함 한정이다(#187).
 *
 * 피드 · 상세의 같은 상황 문구(예: PostDetailGone)와 따로 둔다 — 이쪽을 바꿔도 그쪽은 바꾸지 않는다.
 */

/** 디자인 타이틀 문구. 서버 title("…달렸어요.")이 디자인과 달라 종류로 대체한다. */
const TITLE_BY_TYPE: Partial<Record<InboxNotificationType, string>> = {
  NEW_COMMENTS: "내 게시글에 댓글이 달렸어요",
  NEW_CHILD_COMMENTS: "내 댓글에 대댓글이 달렸어요",
};

/** 디자인에 없는 종류(좋아요 계열 — 노출 여부 기획 확인 중)는 서버 문구를 그대로 쓴다. */
export function inboxTitle(notification: InboxNotification): string {
  const designTitle = notification.type
    ? TITLE_BY_TYPE[notification.type]
    : undefined;
  return designTitle ?? notification.title;
}

/**
 * 알림 대상이 삭제됐을 때의 안내 문구.
 *
 * 앱 토스트 말투("~어요")와 상세의 PostDetailGone "삭제된 게시글이에요"에 맞췄다
 * (이슈 초안 "~삭제되었습니다"에서 변경 · 2026-10-30 디자인 결정).
 *
 * TODO(#187): 서버가 삭제된 대상을 알려주면(backend#154) 셀 탭에서 이동 대신 이 문구를 띄운다.
 */
export const POST_GONE_MESSAGE = "삭제된 게시글이에요";
export const COMMENT_GONE_MESSAGE = "삭제된 댓글이에요";
export const REPLY_GONE_MESSAGE = "삭제된 대댓글이에요";
