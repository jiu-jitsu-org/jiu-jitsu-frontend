"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import {
  markPostAuthorComments,
  type Comment,
  type CommentList as CommentListData,
} from "@/features/community/domain/comment";
import type { CommentSort } from "@/features/community/domain/post";
import { useOnBlockChange } from "@/features/community/presentation/block-change-watcher";
import { CommentItem } from "@/features/community/presentation/comment-item";
import {
  postedNotIn,
  ROOT_PLACEMENT,
  useCommentReply,
  usePlacement,
  useSettlePosted,
} from "@/features/community/presentation/comment-reply-context";
import { track } from "@/shared/lib/analytics";
import { bffFetch } from "@/shared/lib/http/bff-fetch";

/** 버튼 자리를 유지한 채 문구만 바꾼다 — 대댓글 더보기(CommentReplies)와 같은 문구 · 같은 동작. */
const MORE_BUTTON_LABEL = {
  idle: "댓글 더보기",
  loading: "불러오는 중",
  error: "다시 시도",
} as const;

type ExtraPagesState = {
  /** 이 상태가 어떤 목록 위에 쌓인 것인지 — 글이나 정렬이 바뀌면 통째로 버린다. */
  signature: string;
  /** 서버 렌더 첫 페이지 뒤에 이어 받은 페이지들. pages[i]는 서버 page i+1이다. */
  pages: Comment[][];
  /** 마지막으로 받은 페이지의 다음 페이지 여부. 아직 안 받았으면 null(첫 페이지 값을 쓴다). */
  hasNext: boolean | null;
  status: "idle" | "loading" | "error";
};

/** 서버가 최상위 댓글을 주는 한 페이지 크기(backend#161) — 방금 단 댓글이 받은 범위 안에 드는지 판정에 쓴다. */
const COMMENT_PAGE_SIZE = 20;

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
 * 페이징(#222 · #592): 서버는 최상위 댓글을 20개씩 준다(backend#161). 첫 페이지는 상세 SSR이 받아 오고,
 * 「댓글 더보기」를 누를 때마다 다음 20개를 이어 받는다. 끝까지 내리면 저절로 불러오던 무한 스크롤을
 * 버튼으로 바꿨다 — 댓글이 끝없이 이어지면 그 아래(같은 카테고리의 다른 글, #594)에 닿을 수 없다.
 * 개수 표기가 없는 Slice라 hasNext로만 판단하고, 버튼에도 숫자를 쓰지 않는다(대댓글 더보기와 같다).
 *
 * 서버 렌더가 다시 돌면(router.refresh — 댓글·답글 등록, 삭제·신고·차단, 로그인 전환) 첫 페이지만
 * 새로 내려온다. 이어 받은 페이지를 그때 버리면 목록이 20개로 줄며 스크롤이 튀므로, 버리지 않고
 * 같은 범위를 다시 받아 바꿔 끼운다. 다시 받는 동안은 옛 줄이 보이고, 실패하면 옛 줄을 그대로 둔다.
 * 글이나 정렬이 바뀔 때만 통째로 버린다 — 그때는 화면이 새 첫 페이지부터 다시 그려진다.
 *
 * 방금 단 댓글은 서버 렌더를 기다리지 않고 등록 응답으로 바로 끼운다(#486) — 최신순은 맨 위,
 * 작성된 순은 끝까지 받았을 때만 맨 아래. 서버 목록에 같은 id가 오면 그쪽을 쓴다.
 * 작성된 순에서 아직 안 받은 페이지가 있으면 끼울 자리가 없어 넣지 않는다(입력 바가 토스트로 알린다).
 * 대댓글 더보기와 같은 판단으로, 그 한 경우를 위해 끝까지 받아 오지 않는다 — 더보기로 끝까지 받으면 나타난다.
 *
 * 알림에서 연 댓글(#596)은 목록 맨 위에 옅은 면으로 따로 먼저 보여 준다. 첫 페이지 · 더보기에 같은 댓글이
 * 오면 목록에서는 빼 한 번만 보인다. 대댓글이면 원 댓글 묶음에 그 대댓글이 붙어 온다(focusedThreadComment).
 *
 * 댓글이 하나도 없으면 빈 상태(empty)를 그린다 — 첫 댓글도 바로 목록으로 바뀌게 여기서 고른다.
 *
 * sort·postAuthorId는 대댓글 더보기(CommentReplies)까지 내려보내는 값이기도 하다. 추가로 불러온
 * 대댓글이 목록과 같은 정렬을 쓰고 "작성자" 배지도 같은 기준으로 붙으려면 둘 다 필요하다.
 */
export function CommentList({
  contentId,
  comments,
  hasNext,
  focusedComment = null,
  sort,
  postAuthorId,
  empty,
}: {
  /** 댓글이 달린 컨텐츠(게시글·밸런스 게임) id — 다음 페이지 조회에 쓴다. */
  contentId: number;
  /** 서버 렌더 첫 페이지. */
  comments: Comment[];
  /** 첫 페이지 다음이 있는지. */
  hasNext: boolean;
  /** 알림에서 연 댓글(#596) — 맨 위에 먼저, 목록에서는 뺀다. */
  focusedComment?: Comment | null;
  sort: CommentSort;
  postAuthorId?: number | null;
  /** 댓글이 하나도 없을 때 그릴 빈 상태. */
  empty: ReactNode;
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

  const loaded = dedupeById([...comments, ...current.pages.flat()]);
  const hasMore = current.hasNext ?? hasNext;

  // 앱에서 회원 차단이 바뀌면 서버 렌더를 다시 돌린다(#488) — 그 회원의 댓글이 자리 표시로(해제면 본문으로) 바뀐다.
  // 이어 받은 페이지는 아래 다시 받기 경로가, 펼친 대댓글은 CommentReplies가 같은 범위로 갈아 끼운다.
  const router = useRouter();
  useOnBlockChange(() => router.refresh());

  // 방금 단 댓글 중 서버 목록에 아직 없는 것 — 등록한 순서대로 쌓여 있다.
  const { posted } = useCommentReply();
  const fresh = markPostAuthorComments(
    postedNotIn(posted, undefined, loaded),
    postAuthorId,
  );
  // 알림에서 연 댓글은 맨 위에 따로 그리므로 목록에서는 뺀다. 자리 판정(아래)은 서버가 준 개수 그대로 센다.
  const listed = focusedComment
    ? loaded.filter((comment) => comment.id !== focusedComment.id)
    : loaded;
  const items =
    sort === "latest" ? [...fresh.reverse(), ...listed] : [...listed, ...fresh];
  // 최신순은 늘 맨 위(서버 첫 페이지 맨 앞)라 서버 렌더가 바로 서버 것을 가져온다.
  // 작성된 순은 끝까지 받았고, 아직 서버에 안 든 사본까지 세어 새 댓글이 지금 받은 페이지 안에 들어갈 때만
  // 끼운다 — 꽉 찼으면 다음 페이지로 밀려 서버 것이 오지 않는다. 이어 받은 페이지가 있으면 맨 아래는
  // 그 페이지라, 서버 렌더 뒤 다시 받기가 끝나야 서버 것이 온다.
  useSettlePosted(undefined, loaded);
  usePlacement(ROOT_PLACEMENT, () => {
    if (sort === "latest") return "server-render";
    if (
      hasMore ||
      loaded.length + fresh.length >=
        (current.pages.length + 1) * COMMENT_PAGE_SIZE
    )
      return null;
    return current.pages.length > 0 ? "refetch" : "server-render";
  });
  // 첫 페이지(서버 렌더)에서 온 댓글 — 그 미리보기 답글만 서버 렌더가 바로 가져온다.
  const firstPageIds = new Set(comments.map((comment) => comment.id));

  // 연달아 눌러도 한 번만 나가게 막는다(state는 다음 렌더에야 반영된다).
  const loadingRef = useRef(false);
  // 지금 그리는 글·정렬 — 더보기 응답이 왔을 때 아직 같은 목록인지 본다(GA 기록, #619). 아래 latestRef는
  // 이 useCallback보다 뒤에 선언돼 여기서 잡으면 react-hooks/immutability에 걸려 따로 둔다.
  const signatureRef = useRef(current.signature);
  useEffect(() => {
    signatureRef.current = current.signature;
  });
  // 받는 사이 목록이 사라지면(상세 닫힘) 늦은 응답은 붙지 않으니 세지 않는다.
  useEffect(
    () => () => {
      signatureRef.current = "";
    },
    [],
  );

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;

    const requestSignature = current.signature;
    const page = current.pages.length + 1;
    setState({ ...current, status: "loading" });

    const result = await fetchCommentPage(contentId, sort, page);
    loadingRef.current = false;
    // '댓글 더보기' 기록(GA, #619) — 서버 렌더 첫 페이지(page 0)를 1로 센 순번. 받기에 성공했고, 받는 사이
    // 글·정렬이 바뀌지 않아 목록에 붙을 때만.
    if (result && signatureRef.current === requestSignature) {
      track("list_load_more", { page: page + 1 });
    }

    setState((prev) => {
      // 받는 사이 글·정렬이 바뀌었으면 버린다.
      if (prev.signature !== requestSignature) return prev;
      // 실패해도 지금까지 받은 것은 남긴다 — 버튼만 "다시 시도"로 바뀐다.
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

  if (items.length === 0 && !hasMore && !focusedComment) return empty;

  return (
    // 최신순 버튼 바텀↔첫 댓글 24 = 정렬 row pb-3(12) + 여기 pt-3(12). 하단 여유 pb-4.
    // 묶음 사이 24(gap-6) — 알림 댓글 면 · 목록 · 「댓글 더보기」 사이도 같은 간격이다.
    <div className="flex flex-col gap-6 px-4 pb-4 pt-3">
      {focusedComment ? (
        // 알림에서 연 댓글(#596): 선 없이 옅은 파란 면으로 묶어 "알림으로 온 그 댓글"임을 알린다.
        // 면 안쪽 여백(px-2)만큼 바깥으로 당겨(-mx-2) 댓글 글자 줄이 아래 목록과 같은 세로선에 선다.
        <ul
          aria-label="알림에서 연 댓글"
          className="-mx-2 rounded-10 bg-surface-primary-subtle px-2 py-3"
        >
          <CommentItem
            comment={focusedComment}
            sort={sort}
            postAuthorId={postAuthorId}
          />
        </ul>
      ) : null}

      <ul className="flex flex-col gap-6 empty:hidden">
        {items.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            sort={sort}
            postAuthorId={postAuthorId}
            inFirstPage={firstPageIds.has(comment.id)}
          />
        ))}
      </ul>

      {hasMore ? (
        // 대댓글 더보기와 같은 글자 버튼(Body M · comment-replies-text · 높이 19 · 눌림 투명도).
        // 글자는 댓글 본문 왼쪽(띠 아바타 32 + 간격 4 = 36, pl-9)에 맞춘다 — 대댓글 더보기가 대댓글 쪽에 붙듯.
        // 실패하면 "다시 시도"로 바뀌고 다시 누르면 같은 페이지를 다시 받는다.
        <button
          type="button"
          onClick={() => void loadMore()}
          disabled={current.status === "loading"}
          className="flex h-[19px] items-center self-start pl-9 text-body-m text-comment-replies-text motion-safe:transition-opacity motion-safe:duration-150 active:opacity-60"
        >
          {MORE_BUTTON_LABEL[current.status]}
        </button>
      ) : null}
    </div>
  );
}
