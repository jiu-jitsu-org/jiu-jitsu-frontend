"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  markPostAuthorComments,
  type Comment,
  type CommentList as CommentListData,
} from "@/features/community/domain/comment";
import type { CommentSort } from "@/features/community/domain/post";
import {
  FeedLoadMoreError,
  FeedLoadingMore,
} from "@/features/community/presentation/community-feed-list";
import { CommentItem } from "@/features/community/presentation/comment-item";
import { useInfiniteScroll } from "@/features/community/presentation/use-infinite-scroll";
import { bffFetch } from "@/shared/lib/http/bff-fetch";

type ExtraPagesState = {
  /** 이 상태가 어떤 목록 위에 쌓인 것인지 — 글이나 정렬이 바뀌면 통째로 버린다. */
  signature: string;
  /** 서버 렌더 첫 페이지 뒤에 이어 받은 페이지들. pages[i]는 서버 page i+1이다. */
  pages: Comment[][];
  /** 마지막으로 받은 페이지의 다음 페이지 여부. 아직 안 받았으면 null(첫 페이지 값을 쓴다). */
  hasNext: boolean | null;
  status: "idle" | "loading" | "error";
};

function initialState(signature: string): ExtraPagesState {
  return { signature, pages: [], hasNext: null, status: "idle" };
}

/** 먼저 온 항목을 남기고 id 중복을 제거한다 — 페이지 사이 새 댓글로 경계 댓글이 한 번 더 온다. */
function dedupeById(comments: Comment[]): Comment[] {
  const seen = new Set<number>();

  return comments.filter((comment) => {
    if (seen.has(comment.id)) return false;
    seen.add(comment.id);
    return true;
  });
}

/** 최상위 댓글 한 페이지 조회. 실패는 null — 호출부가 지금 목록을 그대로 둔다. */
async function fetchCommentPage(
  contentId: number,
  sort: CommentSort,
  page: number,
): Promise<CommentListData | null> {
  const response = await bffFetch(
    `/api/community/comments?contentId=${contentId}&page=${page}&sort=${sort}`,
    // 대댓글 더보기와 같은 이유 — 브라우저 캐시가 옛 페이지를 돌려주면 그 사이 달린 댓글이 안 보인다.
    { cache: "no-store" },
  ).catch(() => null);

  if (!response?.ok) return null;

  const data = (
    (await response.json().catch(() => null)) as {
      data?: { items?: Comment[]; hasNext?: boolean };
    } | null
  )?.data;

  const items = data?.items;
  if (!Array.isArray(items)) return null;

  return { items, hasNext: data?.hasNext === true };
}

/**
 * 댓글 목록 (클라이언트). 항목 사이 간격 24, 구분선 없음.
 *
 * 간격 위계(#258): 묶음 안(부모→답글, 답글↔답글)은 8, 묶음 사이(최상위 댓글↔다음 최상위)는 24.
 * 셋 다 12로 같으면 마지막 답글·「대댓글 더보기」가 다음 댓글에도 붙어 보여 스레드 경계가 사라진다.
 * 선 없이 간격만으로 "한 댓글 + 그 답글들 = 한 덩어리"로 읽히게 한다.
 *
 * 페이징(#222): 서버는 최상위 댓글을 20개씩 준다(backend#161). 첫 페이지는 상세 SSR이 받아 오고,
 * 목록 끝에 닿으면 다음 페이지를 무한 스크롤로 이어 받는다. 개수 표기가 없는 Slice라 hasNext로만 판단한다.
 *
 * 서버 렌더가 다시 돌면(router.refresh — 댓글·답글 등록, 삭제·신고·차단, 로그인 전환) 첫 페이지만
 * 새로 내려온다. 이어 받은 페이지를 그때 버리면 목록이 20개로 줄며 스크롤이 튀므로, 버리지 않고
 * 같은 범위를 다시 받아 바꿔 끼운다. 다시 받는 동안은 옛 줄이 보이고, 실패하면 옛 줄을 그대로 둔다.
 * 글이나 정렬이 바뀔 때만 통째로 버린다 — 그때는 화면이 새 첫 페이지부터 다시 그려진다.
 *
 * 작성된 순에서 아직 안 받은 페이지가 있으면 방금 단 댓글은 맨 뒤라 바로 안 보인다. 대댓글 더보기와
 * 같은 판단으로, 그 한 경우를 위해 끝까지 받아 오지 않는다 — 끝까지 내리면 나타난다.
 *
 * sort·postAuthorId는 대댓글 더보기(CommentReplies)까지 내려보내는 값이기도 하다. 추가로 불러온
 * 대댓글이 목록과 같은 정렬을 쓰고 "작성자" 배지도 같은 기준으로 붙으려면 둘 다 필요하다.
 */
export function CommentList({
  contentId,
  comments,
  hasNext,
  sort,
  postAuthorId,
}: {
  /** 댓글이 달린 컨텐츠(게시글·밸런스 게임) id — 다음 페이지 조회에 쓴다. */
  contentId: number;
  /** 서버 렌더 첫 페이지. */
  comments: Comment[];
  /** 첫 페이지 다음이 있는지. */
  hasNext: boolean;
  sort: CommentSort;
  postAuthorId?: number | null;
}) {
  const signature = `${contentId}:${sort}`;
  const [state, setState] = useState(() => initialState(signature));

  // 이번 렌더에서 유효한 상태. 글·정렬이 바뀐 렌더에서는 새 상태를 바로 쓰고,
  // 커밋된 state도 맞춰 되돌린다(렌더 중 setState — prop 변경 시 상태 리셋 패턴, CommentReplies와 같다).
  const current =
    state.signature === signature ? state : initialState(signature);
  if (state.signature !== signature) {
    setState(current);
  }

  const items = dedupeById([...comments, ...current.pages.flat()]);
  const hasMore = current.hasNext ?? hasNext;

  // 관찰자가 연달아 불러도 한 번만 나가게 막는다(state는 다음 렌더에야 반영된다).
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;

    const requestSignature = current.signature;
    const page = current.pages.length + 1;
    setState({ ...current, status: "loading" });

    const result = await fetchCommentPage(contentId, sort, page);
    loadingRef.current = false;

    setState((prev) => {
      // 받는 사이 글·정렬이 바뀌었으면 버린다.
      if (prev.signature !== requestSignature) return prev;
      // 실패해도 지금까지 받은 것은 남긴다 — 끝의 안내만 "다시 시도"로 바뀐다.
      if (!result) return { ...prev, status: "error" };
      return {
        ...prev,
        pages: [
          ...prev.pages,
          markPostAuthorComments(result.items, postAuthorId),
        ],
        hasNext: result.hasNext,
        status: "idle",
      };
    });
  }, [contentId, current, hasMore, postAuthorId, sort]);

  // 서버 렌더가 다시 돌아 첫 페이지가 새로 오면, 이어 받은 범위(page 1..n)도 다시 받아 바꿔 끼운다.
  // 최신 상태는 ref로 본다 — 이 effect는 첫 페이지가 바뀔 때만 돌아야 해서 상태를 deps에 넣지 않는다.
  const latestRef = useRef({ current, contentId, sort, postAuthorId });
  useEffect(() => {
    latestRef.current = { current, contentId, sort, postAuthorId };
  });
  useEffect(() => {
    const { current, contentId, sort, postAuthorId } = latestRef.current;
    // 처음 그릴 때·글이나 정렬이 바뀐 직후엔 이어 받은 게 없어 할 일이 없다.
    const count = current.pages.length;
    if (count === 0) return;

    const requestSignature = current.signature;
    void Promise.all(
      Array.from({ length: count }, (_, index) =>
        fetchCommentPage(contentId, sort, index + 1),
      ),
    ).then((results) => {
      // 한 페이지라도 실패하면 옛 줄을 그대로 둔다 — 일부만 바꾸면 페이지 경계가 어긋난다.
      if (results.some((result) => !result)) return;
      const fresh = results as CommentListData[];

      setState((prev) => {
        if (prev.signature !== requestSignature) return prev;
        // 다시 받는 사이 뒤 페이지를 더 받았으면 그 부분은 남긴다.
        const tail = prev.pages.slice(count);
        return {
          ...prev,
          pages: [
            ...fresh.map((page) =>
              markPostAuthorComments(page.items, postAuthorId),
            ),
            ...tail,
          ],
          hasNext: tail.length > 0 ? prev.hasNext : fresh[count - 1].hasNext,
        };
      });
    });
  }, [comments]);

  // 실패 상태에선 자동 재요청을 멈추고 "다시 시도"로만 다시 부른다(피드와 같다).
  const sentinelRef = useInfiniteScroll({
    onReach: () => void loadMore(),
    enabled: hasMore && current.status !== "error",
    resetKey: items.length,
  });

  return (
    <>
      <ul className="flex flex-col gap-6">
        {items.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            sort={sort}
            postAuthorId={postAuthorId}
          />
        ))}
      </ul>

      {hasMore && current.status !== "error" ? (
        <div ref={sentinelRef} aria-hidden className="h-px" />
      ) : null}

      {current.status === "loading" ? (
        <FeedLoadingMore label="댓글 불러오는 중" />
      ) : null}
      {current.status === "error" ? (
        <FeedLoadMoreError
          onRetry={() => void loadMore()}
          message="댓글을 더 불러오지 못했어요"
        />
      ) : null}
    </>
  );
}
