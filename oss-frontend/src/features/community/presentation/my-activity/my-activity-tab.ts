import { getMyBalanceGamesMode } from "@/config/env";
import type { MyPostListKind } from "@/features/community/domain/post-summary";

/**
 * 내 커뮤니티 활동 탭(URL ?tab= 값).
 *
 * 네이티브가 특정 탭으로 바로 열 수 있게 탭을 URL에 둔다(/community/me?tab=saved).
 * URL 어휘(posts)와 업스트림 목록 종류(written)는 이름이 달라 여기서 한 번만 잇는다.
 * "댓글" 탭은 내 댓글 목록 API가 생기면 추가한다.
 *
 * "밸런스 게임" 탭은 업스트림 목록 API가 아직 없어 NEXT_PUBLIC_MY_BALANCE_GAMES(on|preview)일 때만
 * 노출한다. 꺼져 있으면 ?tab=balance도 모르는 값처럼 기본 탭으로 떨어진다.
 */
export type MyActivityTab = MyPostTab | "balance";

/** 게시글 목록(PostList)을 그리는 탭 — 쓴 글 · 저장. */
export type MyPostTab = "posts" | "saved";

const BALANCE_TAB_ENABLED = getMyBalanceGamesMode() !== "off";

export const MY_ACTIVITY_TABS: { value: MyActivityTab; label: string }[] = [
  { value: "posts", label: "쓴 글" },
  { value: "saved", label: "저장" },
  ...(BALANCE_TAB_ENABLED
    ? [{ value: "balance" as const, label: "밸런스 게임" }]
    : []),
];

/** URL 값을 탭으로 좁힌다. 없거나 모르는 값(꺼진 밸런스 탭 포함)이면 기본 탭(쓴 글). */
export function normalizeMyActivityTab(
  raw: string | string[] | undefined,
): MyActivityTab {
  if (raw === "saved") return "saved";
  if (raw === "balance" && BALANCE_TAB_ENABLED) return "balance";
  return "posts";
}

/** 탭 → 업스트림 목록 종류. */
export function toMyPostListKind(tab: MyPostTab): MyPostListKind {
  return tab === "saved" ? "saved" : "written";
}

/** 탭 목록의 다음 페이지 · 복귀 재조회 BFF 경로(쿼리스트링 포함 — page/size는 목록 훅이 붙인다). */
export function myPostListUrl(tab: MyPostTab): string {
  return `/api/community/board/mine?kind=${toMyPostListKind(tab)}`;
}

/** 밸런스 게임 탭의 다음 페이지 BFF 경로. page/size는 목록 훅이 붙인다. */
export const MY_BALANCE_GAME_LIST_URL =
  "/api/community/balance-game/participated";
