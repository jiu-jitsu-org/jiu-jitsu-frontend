import type {
  ReportReason,
  ReportTargetType,
} from "@/features/community/domain/report";
import { contentIdOf, track, type ScreenName } from "@/shared/lib/analytics";

/**
 * 반응 · 신고 · 차단 기록(GA, #580)의 이벤트와 꼬리표 값 — 사전 GA-10. 값은 사전에 적힌 것만 싣는다(닫힌 타입).
 * 모두 서버가 처리한 뒤(성공 · 이미 신고함)에만 부른다. 실패 · 예시(데모)는 남기지 않는다.
 */

/** 좋아요한 대상. 밸런스 게임 좋아요는 글과 같은 엔드포인트지만 대상은 balance_game(id는 contentId). */
export type ReactionContentType = "post" | "comment" | "balance_game";

/** 숨기기 · 신고 · 차단을 누른 메뉴(사전 `from`). */
export type ContentMenuFrom = "feed_menu" | "post_menu" | "comment_menu";

/**
 * 좋아요 · 취소가 서버에 남은 뒤 한 번(`content_like`).
 * from은 누른 순간의 화면(`currentScreenName()` — 피드 · 상세 · 내 활동 · 검색). 기록은 응답 뒤라 그사이 브라우저가
 * 다른 화면으로 옮겨 갔을 수 있어 호출부가 누를 때 읽어 둔다. 저장도 같다.
 */
export function trackContentLike(
  contentType: ReactionContentType,
  id: number,
  liked: boolean,
  from: ScreenName | undefined,
): void {
  track("content_like", {
    content_type: contentType,
    content_id: contentIdOf(contentType, id),
    state: liked ? "on" : "off",
    from,
  });
}

/** 저장 · 취소가 서버에 남은 뒤 한 번(`content_save`). 저장은 글만 있다. */
export function trackContentSave(
  postId: number,
  saved: boolean,
  from: ScreenName | undefined,
): void {
  track("content_save", {
    content_id: contentIdOf("post", postId),
    state: saved ? "on" : "off",
    from,
  });
}

/**
 * 글 숨기기(`content_hide`). undo는 토스트 되돌리기와, 이미 숨긴 글을 다시 눌러 풀린 경우(#530) — 둘 다 결과가 숨김 해제다.
 */
export function trackContentHide(
  postId: number,
  action: "hide" | "undo",
  from: Exclude<ContentMenuFrom, "comment_menu">,
): void {
  track("content_hide", {
    content_id: contentIdOf("post", postId),
    action,
    from,
  });
}

/**
 * 신고 사유 → 사전 `reason`(서버 코드 소문자). 사전 6개에 급히 처리할 두 사유를 더해 iOS(#428)와 같은 8개다.
 * 'other'로 합치면 불법촬영물 신고를 따로 볼 수 없다.
 */
const REPORT_REASON_PARAM: Record<ReportReason, string> = {
  SPAM: "spam",
  ABUSE: "abuse",
  ADULT: "adult",
  HARASSMENT: "harassment",
  INCITEMENT: "incitement",
  RIGHTS_VIOLATION: "rights_violation",
  ILLEGAL_FILMING: "illegal_filming",
  OTHER: "other",
};

/** 시트가 돌려준 사유 코드 → `reason`. 모르는 코드면 undefined(꼬리표에서 빠진다). */
function reportReasonParam(value: string): string | undefined {
  return Object.hasOwn(REPORT_REASON_PARAM, value)
    ? REPORT_REASON_PARAM[value as ReportReason]
    : undefined;
}

/** 신고가 처리된 뒤 한 번(`report_submit`, 이미 신고한 것 포함). 모르는 사유면 reason만 뺀다. */
export function trackReportSubmit(
  reportType: ReportTargetType,
  reason: string,
  from: ContentMenuFrom,
): void {
  track("report_submit", {
    content_type: reportType === "BOARD" ? "post" : "comment",
    reason: reportReasonParam(reason),
    from,
  });
}

/** 차단(on) · 해제(off)가 서버에 남은 뒤 한 번(`user_block`). 해제는 차단한 회원 목록에만 있다. */
export function trackUserBlock(
  blocked: boolean,
  from: ContentMenuFrom | "blocked_list",
): void {
  track("user_block", { state: blocked ? "on" : "off", from });
}
