/**
 * 기록 대상 종류와 id(사전 꼬리표 `content_type` · `content_id`, #579).
 * id는 사전 형식(`post_812` · `cmt_31` · `bg_7` · `comp_45`)으로 싣는다 — 숫자만 실으면 종류끼리 섞인다.
 */
export type AnalyticsContentType = "post" | "balance_game" | "competition";

/** id 형식만 있는 대상 — 댓글은 열람 · 공유 대상이 아니라 좋아요 기록(#580)의 content_id에만 쓴다. */
type ContentIdType = AnalyticsContentType | "comment";

const CONTENT_ID_PREFIX: Record<ContentIdType, string> = {
  post: "post",
  // 댓글 좋아요 기록(#580).
  comment: "cmt",
  balance_game: "bg",
  competition: "comp",
};

export function contentIdOf(type: ContentIdType, id: number): string {
  return `${CONTENT_ID_PREFIX[type]}_${id}`;
}

const CONTENT_PATHS: ReadonlyArray<[RegExp, AnalyticsContentType]> = [
  [/^\/community\/balance\/(\d+)\/?$/, "balance_game"],
  [/^\/community\/(\d+)\/?$/, "post"],
  [/^\/competition\/(\d+)\/?$/, "competition"],
];

/** 주소가 가리키는 대상(글 · 밸런스 게임 · 대회 상세)과 id. 그 밖의 화면은 undefined. 공유 · 앱으로 보기가 같이 쓴다. */
export function contentOfPath(
  pathname: string,
): { type: AnalyticsContentType; id: number } | undefined {
  for (const [pattern, type] of CONTENT_PATHS) {
    const match = pattern.exec(pathname);
    if (match) return { type, id: Number(match[1]) };
  }
  return undefined;
}
