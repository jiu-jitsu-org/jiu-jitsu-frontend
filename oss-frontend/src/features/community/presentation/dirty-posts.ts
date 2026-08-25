"use client";

/**
 * 목록으로 돌아왔을 때 다시 읽어야 할 대상 기록.
 *
 * WHY 필요한가: 상세·작성은 목록을 떠나 다른 화면으로 갔다가 돌아온다. 그동안 좋아요·저장·댓글·
 * 수정·삭제·숨김·신고 중 무엇이 일어났는지 목록은 알 수 없다. 상세가 "무엇을 했는지"를 목록에
 * 알려주는 방식은 행위마다 계약이 늘고 상세가 목록 내부 구조를 알아야 해 결합이 커진다.
 * 대신 "이 글은 값이 바뀌었을 수 있다"는 사실만 남기고, 복귀 시 서버 최신값을 다시 읽는다.
 *
 * WHY sessionStorage인가:
 * - React state로는 못 버틴다 — 웹에서 router.push로 상세에 갔다 돌아오면 목록이 재마운트되면서
 *   state가 사라진다. 정작 그때 이 기록이 필요하다.
 * - localStorage는 과하다 — 이 기록은 목록이 있는 웹뷰/탭 안에서만 의미가 있다. 다른 탭의 목록이
 *   내 기록을 소비하면 그쪽은 멀쩡한 카드를 헛되이 다시 읽는다.
 *   (상세 → 목록처럼 웹뷰를 건너가야 하는 pending-toast와 반대되는 선택이다.)
 * - 앱에서도 리스트 웹뷰는 살아 있으므로 같은 저장소가 그대로 동작한다 — 웹/앱이 한 메커니즘을 쓴다.
 */
const DIRTY_POSTS_KEY = "feed-dirty-posts";
const FEED_STALE_KEY = "feed-stale";

/** 복귀 시 다시 읽어야 할 목록 상태. */
export type FeedRevalidateTarget = {
  /** 단건 재조회 대상 게시글 id. */
  postIds: number[];
  /** 첫 페이지를 다시 읽어야 하는지(새 글이 생겼을 수 있음). */
  feedStale: boolean;
};

function readIds(): number[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.sessionStorage.getItem(DIRTY_POSTS_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((id): id is number => typeof id === "number");
  } catch {
    // 사파리 프라이빗 모드 등 스토리지 차단 환경. 갱신이 늦어질 뿐 화면이 깨지지는 않는다.
    return [];
  }
}

/**
 * 이 게시글을 갱신 대상으로 기록한다 — 상세를 열 때 호출.
 *
 * 상세에서 또 다른 글로 이동하는 경로가 생기면 대상이 복수가 되므로 처음부터 목록으로 다룬다.
 */
export function markPostDirty(postId: number): void {
  if (typeof window === "undefined") return;

  try {
    const ids = readIds();
    if (ids.includes(postId)) return;

    window.sessionStorage.setItem(
      DIRTY_POSTS_KEY,
      JSON.stringify([...ids, postId]),
    );
  } catch {
    // 위와 같음 — 조용히 포기한다.
  }
}

/**
 * 목록 첫 페이지를 다시 읽어야 한다고 기록한다 — 작성 화면을 열 때 호출.
 *
 * 작성은 아직 id가 없어 단건 대상을 지정할 수 없다. 등록 성공 여부와 무관하게 표시해 두고,
 * 취소로 돌아왔으면 첫 페이지에 새 글이 없어 결과적으로 아무 변화가 없다.
 */
export function markFeedStale(): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(FEED_STALE_KEY, "1");
  } catch {
    // 위와 같음.
  }
}

/**
 * 기록을 읽는다. **지우지 않는다** — 삭제는 clearRevalidated가 따로 한다.
 *
 * WHY 분리했는가: 스와이프 백을 중간에 취소하면 목록이 잠깐 드러났다 다시 덮인다(실측 확인).
 * 그 순간 읽자마자 지우면, 사용자는 여전히 상세에 있는데 기록만 사라져 이후 좋아요·댓글이
 * 목록에 영영 반영되지 않는다. 읽기와 삭제를 나눠 "진짜 복귀"가 확인된 뒤에만 지운다.
 */
export function peekRevalidateTarget(): FeedRevalidateTarget {
  if (typeof window === "undefined") return { postIds: [], feedStale: false };

  let feedStale = false;
  try {
    feedStale = window.sessionStorage.getItem(FEED_STALE_KEY) === "1";
  } catch {
    // 위와 같음.
  }

  return { postIds: readIds(), feedStale };
}

/**
 * 처리 완료된 항목만 골라 지운다.
 *
 * 통째로 비우지 않는 이유: 읽은 뒤 삭제까지 사이에 새 기록이 들어올 수 있다(상세를 다시 열었을 때).
 * 그 기록까지 지우면 방금 연 글이 갱신 대상에서 빠진다.
 */
export function clearRevalidated(target: FeedRevalidateTarget): void {
  if (typeof window === "undefined") return;

  try {
    const done = new Set(target.postIds);
    const rest = readIds().filter((id) => !done.has(id));

    if (rest.length > 0) {
      window.sessionStorage.setItem(DIRTY_POSTS_KEY, JSON.stringify(rest));
    } else {
      window.sessionStorage.removeItem(DIRTY_POSTS_KEY);
    }

    if (target.feedStale) window.sessionStorage.removeItem(FEED_STALE_KEY);
  } catch {
    // 위와 같음.
  }
}
