import { contentIdOf, type AnalyticsContentType } from "./content";
import { currentScreenName } from "./screen-view";
import type { ScreenFrom } from "./screens";
import { track } from "./track";

/** 열람 기록에 더하는 목록 순번 · 알림 정보 — 부르는 쪽(목록 · 알림함)만 안다. */
export type SelectContentDetail = {
  /** 목록에서 몇 번째 항목인가(1부터). 순번이 없는 입구(카드 하나, 배너)는 뺀다. */
  position?: number;
  /** 알림함 항목의 종류(서버 pushType 소문자). */
  noticeType?: string;
  /** 알림함 항목을 누를 때 안 읽은 상태였나. */
  wasUnread?: boolean;
};

/**
 * 목록 · 알림에서 글 · 밸런스 게임 · 대회를 눌러 열었다(`select_content`, #619).
 * 여는 함수(`useOpenPostDetail` · `useOpenBalanceDetail` · `useOpenCompetitionDetail`)가 열 때 한 번 남긴다 —
 * 여는 함수를 거치는 입구는 따로 달지 않아도 된다. 거치지 않는 길(밸런스 마감 토스트의 '오늘의 밸런스 게임 보기')은
 * 그 자리에서 부른다.
 * from은 여는 함수에 넘긴 값, 없으면 지금 화면 이름(entryPath와 같은 규칙).
 */
export function trackSelectContent(
  type: AnalyticsContentType,
  id: number,
  from: ScreenFrom | undefined,
  detail: SelectContentDetail = {},
): void {
  track("select_content", {
    content_type: type,
    content_id: contentIdOf(type, id),
    from: from ?? currentScreenName(),
    competition_id:
      type === "competition" ? contentIdOf("competition", id) : undefined,
    notice_type: detail.noticeType,
    position: detail.position,
    was_unread: detail.wasUnread,
  });
}
