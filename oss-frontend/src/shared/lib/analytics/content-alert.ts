import { contentIdOf } from "./content";
import { track } from "./track";

/**
 * 알림 종을 켠 · 끈 곳(사전 "from 값") — 글 · 밸런스 게임 상세 앱바의 종, 대회 상세 종, 첫 관심 뒤 마감 알림 시트,
 * 알림함 "이 대회 알림 받지 않기". 주소로 오는 입구가 아니라 이 기록에만 쓰여 `ScreenFrom`과 따로 둔다.
 */
export type ContentAlertFrom =
  | "post_detail"
  | "balance_detail"
  | "alert_bell"
  | "interest_sheet"
  | "notification";

/** 알림을 켜고 끈 대상. 대회는 id를 꼭 받는다(`competition_id`) — 시트가 대상 없이 열린 경우만 undefined. */
export type ContentAlertTarget =
  | { type: "post" | "balance_game" }
  | { type: "competition"; id: number | undefined };

/**
 * 글 · 밸런스 게임 · 대회 알림을 켰다 · 껐다(`content_alert_toggle`, #578). 서버가 저장을 확정한 뒤에만 부른다 —
 * 실패 · 로그인 필요 · 예시(데모)는 남기지 않는다. on은 저장된 상태(서버가 돌려준 값).
 * 대회는 실제로 알림이 가는 상태가 바뀐 순간만 센다 — 설정이 꺼져 있어 시트가 뜨면 '알림 받기'가 성공할 때.
 */
export function trackContentAlertToggle(
  target: ContentAlertTarget,
  on: boolean,
  from: ContentAlertFrom,
): void {
  track("content_alert_toggle", {
    content_type: target.type,
    state: on ? "on" : "off",
    from,
    competition_id:
      target.type === "competition" && target.id !== undefined
        ? contentIdOf("competition", target.id)
        : undefined,
  });
}

/** 알림함 "모두 읽음"이 저장됐다(`notification_read_all`, #578). 꼬리표 없음. */
export function trackNotificationReadAll(): void {
  track("notification_read_all");
}
