/**
 * 웹뷰 화면 이름(GA 이벤트 사전 "화면 이름")과 주소의 짝(#576).
 *
 * 화면 이름은 `screen_view`의 screen_name이자, 그 화면에서 연 다음 화면의 `from` 기본값이다.
 * 여러 기능(커뮤니티 · 대회 · 정책)에 걸쳐 한 표로 둔다.
 */


/**
 * 들어온 길(`from`) 값 — 사전 "from 값" 중 웹이 싣는 것. 화면 이름도 그대로 from 값이다.
 * 사전과 다른 값(오타)이 GA에 쌓이지 않게 닫힌 목록으로 둔다. 새 입구는 사전에 먼저 더한다.
 */
/** 화면 이름(사전 "화면 이름"의 웹뷰 화면). 타입도 이 목록에서 만든다 — 한 곳만 고치면 된다. */
const SCREEN_NAMES = [
  "home_feed",
  "post_detail",
  "post_write",
  "post_edit",
  "balance_detail",
  "notification_inbox",
  "my_activity",
  "blocked_users",
  "competition_list",
  "competition_calendar",
  "competition_detail",
  "community_search",
  "policy",
] as const;

export type ScreenName = (typeof SCREEN_NAMES)[number];

const ENTRY_FROMS = [
  "feed_button",
  "feed_menu",
  "feed_competition_card",
  "post_competition_card",
  "competition_banner",
  "competition_story",
  "balance_card",
  "notification",
  "post_create",
  "balance_closed",
  // 홈 카테고리 탭의 '이 주제로 쓰기'(#590) — 이번 주 써 볼 주제로 연 글쓰기.
  "topic_suggestion",
  // 글 검색 0건의 '이 주제로 글쓰기'(#591).
  "search_empty",
  // 브라우저 뒤로 가기로 다시 보인 화면(#576 후속) — 처음 입구를 다시 쓰지 않고 입구 집계에서 뺀다.
  "back",
] as const;

export type ScreenFrom = ScreenName | (typeof ENTRY_FROMS)[number];

const SCREEN_FROMS = new Set<string>([...SCREEN_NAMES, ...ENTRY_FROMS]);

/** 바꾸기 전 글 수정 표시(`?from=detail`, #576 전) — 기록에는 지금 이름으로 싣는다. */
const LEGACY_FROMS: Record<string, ScreenFrom> = { detail: "post_detail" };

/** 주소에서 읽은 from을 사전 값으로. 사전 밖 값(손으로 친 주소 등)은 undefined. */
export function toScreenFrom(value: string | null): ScreenFrom | undefined {
  if (!value) return undefined;
  if (LEGACY_FROMS[value]) return LEGACY_FROMS[value];
  return SCREEN_FROMS.has(value) ? (value as ScreenFrom) : undefined;
}

export type Screen = {
  name: ScreenName;
  /** 한 화면 안의 부분(내 활동 탭, 약관 종류). */
  section?: string;
};

const MY_ACTIVITY_SECTIONS = new Set(["posts", "saved", "balance"]);

const POLICY_SECTIONS: Record<string, string> = {
  "terms-of-service": "terms",
  "privacy-policy": "privacy",
  "marketing-consent": "marketing",
};

/**
 * 주소의 화면. 기록하지 않는 주소(고객 지원 · 디자인 시스템 · 버전 정보 · 모르는 주소)는 null.
 * 대회 달력은 주소가 아니라 목록 화면 안의 보기 전환이라 여기서는 늘 목록이다(전환은 화면이 알린다).
 */
export function screenOf(
  pathname: string,
  searchParams?: URLSearchParams,
): Screen | null {
  const path =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  if (path === "/") return { name: "home_feed" };
  if (path === "/competition") return { name: "competition_list" };
  if (/^\/competition\/\d+$/.test(path)) return { name: "competition_detail" };
  if (path === "/community/write") return { name: "post_write" };
  if (path === "/community/notifications")
    return { name: "notification_inbox" };
  if (path === "/community/blocked-users") return { name: "blocked_users" };
  if (path === "/community/search") return { name: "community_search" };
  if (path === "/community/me") {
    const tab = searchParams?.get("tab");
    return {
      name: "my_activity",
      section: tab && MY_ACTIVITY_SECTIONS.has(tab) ? tab : "posts",
    };
  }
  if (/^\/community\/balance\/\d+$/.test(path))
    return { name: "balance_detail" };
  if (/^\/community\/\d+\/edit$/.test(path)) return { name: "post_edit" };
  if (/^\/community\/\d+$/.test(path)) return { name: "post_detail" };
  if (path === "/policies") return { name: "policy" };
  const policy = /^\/policies\/([a-z-]+)$/.exec(path);
  if (policy && POLICY_SECTIONS[policy[1]]) {
    return { name: "policy", section: POLICY_SECTIONS[policy[1]] };
  }
  return null;
}

/** 주소에 들어온 길(`?from=`)을 붙인다. 이미 쿼리가 있으면 이어 붙인다. */
export function withFrom(path: string, from: string | undefined): string {
  if (!from) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}from=${encodeURIComponent(from)}`;
}
