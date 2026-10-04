import type { MyPostListKind } from "@/features/community/domain/post-summary";

/**
 * 내 커뮤니티 활동 탭(URL ?tab= 값).
 *
 * 네이티브가 특정 탭으로 바로 열 수 있게 탭을 URL에 둔다(/community/me?tab=saved).
 * URL 어휘(posts)와 업스트림 목록 종류(written)는 이름이 달라 여기서 한 번만 잇는다.
 * "댓글" 탭은 내 댓글 목록 API가 생기면 추가한다.
 */
export type MyActivityTab = "posts" | "saved";

export const MY_ACTIVITY_TABS: { value: MyActivityTab; label: string }[] = [
  { value: "posts", label: "쓴 글" },
  { value: "saved", label: "저장" },
];

/** URL 값을 탭으로 좁힌다. 없거나 모르는 값이면 기본 탭(쓴 글). */
export function normalizeMyActivityTab(
  raw: string | string[] | undefined,
): MyActivityTab {
  return raw === "saved" ? "saved" : "posts";
}

/** 탭 → 업스트림 목록 종류. */
export function toMyPostListKind(tab: MyActivityTab): MyPostListKind {
  return tab === "saved" ? "saved" : "written";
}

/** 탭 목록의 다음 페이지 · 복귀 재조회 BFF 경로(쿼리스트링 포함 — page/size는 목록 훅이 붙인다). */
export function myPostListUrl(tab: MyActivityTab): string {
  return `/api/community/board/mine?kind=${toMyPostListKind(tab)}`;
}
