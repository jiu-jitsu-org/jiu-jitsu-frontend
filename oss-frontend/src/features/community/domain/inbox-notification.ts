/**
 * 커뮤니티 알림함 도메인 타입 (#187).
 *
 * 업스트림: GET /notice (알림 목록) 응답 계약.
 * 이름이 Notification이 아닌 이유: 브라우저 전역 `Notification`(Web Notifications API)과 겹친다.
 * 이 코드베이스에서 notice는 "글 단위 알림 수신 설정"(notice-setting)을 가리키므로 그 이름도 피한다.
 */

/** pushType — 어떤 일로 생긴 알림인지. 셀 타이틀 · 아이콘을 고르는 기준이다. */
export type InboxNotificationType =
  | "NEW_COMMENTS"
  | "NEW_CHILD_COMMENTS"
  | "CONTENTS_LIKE"
  | "COMMENTS_LIKE"
  /** 관심 대회 얼리버드 마감 전날(#422) */
  | "COMPETITION_EARLY_BIRD_DEADLINE"
  /** 관심 대회 접수 마감 전날(#422) */
  | "COMPETITION_REGISTRATION_DEADLINE";

/**
 * 셀을 탭했을 때 열 대상 — actionType + data를 해석한 결과.
 *
 * BOARD_DETAIL → 게시글 상세, BALANCE_DETAIL → 밸런스 게임 상세(data = contentId),
 * COMPETITION_DETAIL → 대회 상세(data = 대회 id, #422).
 * 해석할 수 없으면(알 수 없는 actionType · 숫자가 아닌 data) null — 읽음 처리만 하고 이동하지 않는다.
 */
export type InboxNotificationTarget =
  | { kind: "post"; postId: number }
  | { kind: "balance"; contentId: number }
  | { kind: "competition"; competitionId: number };

/**
 * 알림 대상 중 무엇이 삭제됐는지 — 셀을 탭했을 때 이동하지 않고 띄울 안내 문구를 고르는 기준이다.
 *
 * 게시글이 지워지면 그 아래 댓글 알림도 "post"다(열 화면 자체가 없다).
 * 댓글 · 대댓글만 지워진 경우는 서버가 알려줘야만 구분된다 — 알림 응답에는 댓글 id가 없다.
 * "competition"은 대회가 지워졌거나 미공개로 바뀐 경우다(#422).
 */
export type InboxGoneKind = "post" | "comment" | "reply" | "competition";

export type InboxNotification = {
  id: number;
  /** 알 수 없는 pushType(서버가 새 종류를 추가했는데 FE가 아직 모름)이면 null — 서버 title로 그린다. */
  type: InboxNotificationType | null;
  /**
   * 서버 title. 댓글 계열은 디자인 문구와 달라 화면이 type으로 대체하고,
   * 좋아요 계열은 지금 좋아요 수가 들어간 서버 문구를 그대로 쓴다("내 게시글에 좋아요가 7개 달렸어요", backend#196).
   */
  title: string;
  /**
   * 서버 body — 카드 본문 1줄로 그대로 쓴다(backend#177, #196).
   * 댓글 · 게시글 좋아요 = 게시글 제목(밸런스 게임은 빈 값), 댓글 좋아요 = 좋아요 받은 댓글,
   * 대댓글 = 답글이 달린 내 댓글 — 내 최상위 댓글이거나, 누가 내 대댓글을 태그해 답했으면 그 내 대댓글이다(#473, backend#219).
   */
  body: string;
  target: InboxNotificationTarget | null;
  /**
   * 대상이 삭제됐으면 그 종류, 아니면 null.
   *
   * 서버가 목록을 줄 때 알려주는 값이다(deletedStatus, backend#154). 목록을 받은 뒤에 지워진 것은
   * 모른다 — 그때는 상세가 다시 거른다.
   */
  gone: InboxGoneKind | null;
  isRead: boolean;
  /**
   * createdAt(ISO 8601, 오프셋 명시). 화면이 공통 상대 시간 규칙으로 표시한다(#188).
   * 좋아요 카드는 글 · 댓글마다 한 장이라 마지막 좋아요 시각이다 — 푸시가 가지 않는 기준 사이 좋아요에도
   * 카드가 안 읽음으로 맨 위로 올라오며 이 시각이 바뀐다(backend#219).
   */
  createdAt: string;
};

/** 대회 마감 알림인지(#422) — 셀 아이콘과 '이 대회 알림 받지 않기'를 단다. */
export function isCompetitionNotification(
  notification: InboxNotification,
): boolean {
  return (
    notification.type === "COMPETITION_EARLY_BIRD_DEADLINE" ||
    notification.type === "COMPETITION_REGISTRATION_DEADLINE"
  );
}

/** 알림함 노출 기간(일). 푸터 안내 문구에 쓴다. 기간 필터 자체는 서버 몫이다(backend#154). */
export const INBOX_RETENTION_DAYS = 30;
