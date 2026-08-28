"use client";

import { useCallback, useEffect, useRef } from "react";

import type { PostDetail } from "@/features/community/domain/post";
import {
  FEED_PAGE_SIZE,
  type PostList,
  type PostSummary,
} from "@/features/community/domain/post-summary";
import {
  clearRevalidated,
  peekRevalidateTarget,
} from "@/features/community/presentation/dirty-posts";
import { bffFetch } from "@/shared/lib/http/bff-fetch";

/**
 * 목록이 다시 전면에 왔을 때, 바뀌었을 수 있는 게시글만 서버에서 다시 읽어 반영한다(#73).
 *
 * WHY 전체 새로고침이 아닌가: useBoardFeed는 items를 누적하고 page를 이어받는 구조라, 리셋하면
 * 누적 페이지와 스크롤이 전부 날아간다. 그래서 대상만 골라 제자리에서 갈아 끼운다.
 *
 * WHY 행위를 전달받지 않는가: 상세가 "무엇을 했는지"(좋아요 · 저장 · 댓글 · 수정 · 삭제 · 신고)를
 * 목록에 알려주면 행위마다 계약이 늘고 상세가 목록 내부 구조를 알아야 한다. 서버 최신값을 다시
 * 읽는 방식은 행위 종류와 무관해 이후 기능이 늘어도 이 로직이 그대로다.
 * (숨김만 예외다 — 서버가 숨김을 응답에 표시하지 않아 상세가 직접 알린다.)
 *
 * 복귀 신호는 두 가지를 함께 듣는다. 마운트 한 번으로는 부족하다 — 웹에서 bfcache 복귀는 마운트를
 * 일으키지 않고, 앱에서는 리스트 웹뷰가 살아 있는 채로 가려졌다 돌아온다.
 * 앱에서 서브뷰 닫힘(네이티브 뒤로가기 · 스와이프 백 · CLOSE_SUBVIEW)이 모두 visibilitychange로
 * 잡히는 것은 실측으로 확인했다.
 *
 * 다만 스와이프 백을 중간에 취소하면 목록이 잠깐 드러났다 다시 덮인다 — 이때도 visible이 온다.
 * 그래서 재조회는 즉시 하되(갱신을 늦추지 않는다), 기록 삭제는 화면이 계속 떠 있는 것을 확인한
 * 뒤로 미룬다. 취소된 스와이프에서는 재조회 한 번이 낭비되지만 화면이 틀어지지는 않는다.
 *
 * FIXME(정확도): 서브뷰 닫힘 통지(jiu-jitsu-org/jiu-jitsu-ios#22)가 들어오면 "진짜 복귀"를 추측하지
 * 않고 알 수 있어 아래 유예 시간이 필요 없어진다. 필수는 아니고 정확도 개선용이다.
 */
/**
 * 기록을 지우기 전에 "계속 보이는지" 확인하는 유예 시간(ms).
 *
 * 실측한 스와이프 취소는 visible → hidden이 약 1초였다. 그보다 넉넉하게 잡되, 이 시간 안에 다시
 * 상세로 들어가면 어차피 새 기록이 쌓이므로 길어서 손해 볼 것은 없다.
 */
const RETURN_CONFIRM_DELAY_MS = 2000;

export function useFeedRevalidate({
  replacePost,
  removePost,
  prependNew,
}: {
  replacePost: (post: PostSummary) => void;
  removePost: (postId: number) => void;
  prependNew: (posts: PostSummary[]) => void;
}) {
  // "진짜 복귀" 확정 타이머. 다시 가려지면 취소해 기록을 남긴다.
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 세 콜백 모두 참조가 안정적이라(useBoardFeed의 useCallback([]) 또는 그것만 의존하는 래퍼)
  // 그대로 의존성에 두어도 아래 effect가 리스너를 재등록하지 않는다. 호출부가 여기에 넘기는
  // removePost는 실제로는 "접었다 제거"라, 이 조건이 깨지면 복귀 감지가 통째로 흔들린다.
  const revalidate = useCallback(async () => {
    const target = peekRevalidateTarget();
    if (target.postIds.length === 0 && target.createdPostId === null) return;

    const createdPostId = target.createdPostId;
    await Promise.all([
      ...target.postIds.map((postId) =>
        revalidatePost(postId, { replacePost, removePost }),
      ),
      createdPostId !== null
        ? revalidateFirstPage(createdPostId, { prependNew })
        : null,
    ]);

    // 화면이 계속 떠 있으면 복귀가 확정된 것으로 보고 기록을 지운다.
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    confirmTimer.current = setTimeout(() => {
      if (document.visibilityState === "visible") clearRevalidated(target);
    }, RETURN_CONFIRM_DELAY_MS);
  }, [prependNew, removePost, replacePost]);

  useEffect(() => {
    function handlePageShow() {
      void revalidate();
    }
    function handleVisibility() {
      if (document.visibilityState === "visible") {
        void revalidate();
        return;
      }

      // 다시 가려졌다 = 복귀가 아니었다(스와이프 취소 등). 기록을 남긴 채 확정을 취소한다.
      if (confirmTimer.current) {
        clearTimeout(confirmTimer.current);
        confirmTimer.current = null;
      }
    }

    // bfcache 복귀 포함. 재마운트된 경우에도 아래 즉시 호출에서 한 번 소비된다.
    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibility);
    void revalidate();

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, [revalidate]);
}

/**
 * 단건 재조회 → 제자리 교체. 404면 목록에서 걷어낸다.
 *
 * 404는 삭제 · 신고 · 차단 · 숨김이 모두 수렴하는 응답이라(실측 확인), 사유를 구분할 필요가 없다.
 * 그 외 실패(네트워크 · 5xx)는 카드를 건드리지 않는다 — 지우는 것보다 옛 값이 낫다.
 */
async function revalidatePost(
  postId: number,
  handlers: {
    replacePost: (post: PostSummary) => void;
    removePost: (postId: number) => void;
  },
): Promise<void> {
  try {
    const response = await bffFetch(`/api/community/posts/${postId}`);

    if (response.status === 404) {
      handlers.removePost(postId);
      return;
    }
    if (!response.ok) return;

    // 상세 응답(PostDetail)은 목록 항목(PostSummary)의 상위 집합이다 — 카드가 쓰는 필드는 모두
    // 들어 있고 tags · views · noticeEnabled만 더 있다. 목록에 상세 전용 필드를 섞지 않도록 추린다.
    const body = (await response.json().catch(() => null)) as
      | { data?: PostDetail }
      | null;
    if (body?.data) handlers.replacePost(toSummary(body.data));
  } catch {
    // 재조회 실패는 조용히 넘긴다 — 다음 복귀에 다시 시도된다.
  }
}

/** 상세 응답에서 목록 카드가 쓰는 필드만 추린다. */
function toSummary(detail: PostDetail): PostSummary {
  return {
    id: detail.id,
    categoryId: detail.categoryId,
    categoryName: detail.categoryName,
    author: detail.author,
    title: detail.title,
    body: detail.body,
    images: detail.images,
    counts: detail.counts,
    viewer: detail.viewer,
    createdAt: detail.createdAt,
    timeAgo: detail.timeAgo,
    updatedAt: detail.updatedAt,
    edited: detail.edited,
  };
}

/**
 * 첫 페이지 재조회 → 새 글만 앞에 붙인다(작성 후 복귀).
 *
 * 내가 등록한 글이 실제로 실려 왔을 때만 최상단으로 올린다. 첫 페이지를 다시 읽으면 그 사이
 * **다른 사용자가 쓴 글도 함께** 딸려오는데, 그것 때문에 화면이 튀면 읽던 자리를 잃는다.
 * 스크롤 이동은 "내가 쓰고 돌아왔을 때"로만 한정한다.
 *
 * 즉시 이동(smooth 아님)인 이유: 몇 페이지 내려가 있으면 부드러운 스크롤이 수 초씩 흘러 오히려
 * 어지럽다. 툭 올라가서 내 글이 첫 카드로 보이는 편이 명확하다.
 */
async function revalidateFirstPage(
  createdPostId: number,
  handlers: { prependNew: (posts: PostSummary[]) => void },
): Promise<void> {
  try {
    const response = await bffFetch(
      `/api/community/board?boardListType=FEED&page=0&size=${FEED_PAGE_SIZE}`,
    );
    if (!response.ok) return;

    const body = (await response.json().catch(() => null)) as
      | { data?: PostList }
      | null;
    const fresh = body?.data?.items;
    if (!fresh) return;

    handlers.prependNew(fresh);

    if (fresh.some((post) => post.id === createdPostId)) {
      window.scrollTo({ top: 0 });
    }
  } catch {
    // 위와 같음.
  }
}
