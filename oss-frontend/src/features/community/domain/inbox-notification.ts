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
  | "COMMENTS_LIKE";

/**
 * 셀을 탭했을 때 열 대상 — actionType + data를 해석한 결과.
 *
 * BOARD_DETAIL → 게시글 상세, BALANCE_DETAIL → 밸런스 게임 상세. data는 둘 다 contentId다.
 * 해석할 수 없으면(알 수 없는 actionType · 숫자가 아닌 data) null — 읽음 처리만 하고 이동하지 않는다.
 */
export type InboxNotificationTarget =
  | { kind: "post"; postId: number }
  | { kind: "balance"; contentId: number };

/**
 * 알림 대상 중 무엇이 삭제됐는지 — 셀을 탭했을 때 이동하지 않고 띄울 안내 문구를 고르는 기준이다.
 *
 * 게시글이 지워지면 그 아래 댓글 알림도 "post"다(열 화면 자체가 없다).
 * 댓글 · 대댓글만 지워진 경우는 서버가 알려줘야만 구분된다 — 알림 응답에는 댓글 id가 없다.
 */
export type InboxGoneKind = "post" | "comment" | "reply";

export type InboxNotification = {
  id: number;
  /** 알 수 없는 pushType(서버가 새 종류를 추가했는데 FE가 아직 모름)이면 null — 서버 title로 그린다. */
  type: InboxNotificationType | null;
  /** 서버 title. 디자인 문구와 달라 지금은 화면이 type으로 대체한다(카드 노출 정책 수정 예정). */
  title: string;
  /** 서버 body. 카드 본문 노출 정책이 수정 예정이라 지금은 그대로 쓴다. */
  body: string;
  target: InboxNotificationTarget | null;
  /**
   * 대상이 삭제됐으면 그 종류, 아니면 null.
   *
   * 서버가 알려주는 값이다(backend#154). 지금 GET /notice 응답에는 이 값이 없어 항상 null이고,
   * 그동안은 화면이 셀 탭 시 대상 게시글을 조회해 대신 판단한다.
   */
  gone: InboxGoneKind | null;
  isRead: boolean;
  /** createdAt(ISO 8601, 오프셋 명시). 화면이 공통 상대 시간 규칙으로 표시한다(#188). */
  createdAt: string;
};

/** 알림함 노출 기간(일). 푸터 안내 문구에 쓴다. 기간 필터 자체는 서버 몫이다(backend#154). */
export const INBOX_RETENTION_DAYS = 30;
