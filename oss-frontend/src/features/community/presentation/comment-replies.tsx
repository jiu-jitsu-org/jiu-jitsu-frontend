"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { useAuth } from "@/features/auth/presentation/auth-provider";
import {
  markPostAuthorComments,
  type Comment,
} from "@/features/community/domain/comment";
import type { CommentSort } from "@/features/community/domain/post";
import { CommentItem } from "@/features/community/presentation/comment-item";
import { bffFetch } from "@/shared/lib/http/bff-fetch";

/** 버튼 자리를 유지한 채 문구만 바꾼다 — 로딩·실패로 레이아웃이 흔들리지 않게. */
const BUTTON_LABEL = {
  idle: "대댓글 더보기",
  loading: "불러오는 중",
  failed: "다시 시도",
} as const;

type RepliesState = {
  /** 이 상태가 어떤 정렬·로그인 위에 쌓인 것인지 — 달라지면 통째로 버린다. */
  resetKey: string;
  /** 이 상태가 마지막으로 본 서버 미리보기. 바뀌면 서버 렌더가 다시 돈 것이다(답글 등록·삭제 등). */
  preview: Comment[];
  /** 「더보기」로 이어 받은 페이지들(page 0부터 순서대로). */
  pages: Comment[][];
  /**
   * 서버 렌더가 다시 돈 직후, 이어 받은 페이지를 다시 받는 동안 붙들어 두는 옛 미리보기.
   * 최신순에서 답글이 하나 늘면 미리보기에서 밀려난 줄이 아직 다시 받지 않은 페이지에도 없어서
   * 그 사이 한 줄이 잠깐 사라진다 — 그 틈을 메운다. 다시 받기가 끝나면 비운다.
   */
  carry: Comment[];
  /** 서버 렌더가 다시 돈 횟수 — 이어 받은 페이지를 다시 받는 effect의 신호. */
  generation: number;
  /** 서버가 알려준 다음 페이지 존재 여부. null이면 아직 한 번도 부르지 않았다. */
  hasNext: boolean | null;
  status: keyof typeof BUTTON_LABEL;
};

function initialState(resetKey: string, preview: Comment[]): RepliesState {
  return {
    resetKey,
    preview,
    pages: [],
    carry: [],
    generation: 0,
    hasNext: null,
    status: "idle",
  };
}

/** 단 순서(오래된 것 → 새 것)로 줄 세운다. 시각이 같거나 읽을 수 없으면 id(등록 순)로 가른다. */
function byPostedOrder(a: Comment, b: Comment): number {
  const diff = Date.parse(a.createdAt) - Date.parse(b.createdAt);
  return Number.isNaN(diff) || diff === 0 ? a.id - b.id : diff;
}

/** 먼저 온 항목을 남기고 id 중복을 제거한다. */
function dedupeById(comments: Comment[]): Comment[] {
  const seen = new Set<number>();

  return comments.filter((comment) => {
    if (seen.has(comment.id)) return false;
    seen.add(comment.id);
    return true;
  });
}

/** 대댓글 한 페이지 조회. 실패는 null로 돌려 호출부가 "다시 시도"로 전환하게 한다. */
async function fetchReplyPage(
  parentId: number,
  sort: CommentSort,
  page: number,
): Promise<{ items: Comment[]; hasNext: boolean } | null> {
  const response = await bffFetch(
    `/api/community/comments/${parentId}/replies?page=${page}&sort=${sort}`,
    // 같은 URL을 다시 열었을 때 브라우저 캐시가 옛 목록을 돌려주면, 그 사이 달린 답글이
    // 영영 안 보인다 — 더보기는 매번 서버에 물어야 한다.
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
 * 대댓글 묶음 (클라이언트).
 *
 * 서버는 게시글 상세 응답에 대댓글을 상위 3개만 실어 준다(backend#111). 4번째부터는
 * 「대댓글 더보기」를 눌러 10개씩 이어 받는다(backend#115) — 같은 화면에서 인라인으로 늘어나고
 * 별도 화면으로 이동하지 않는다.
 *
 * 버튼 노출 판정: 아직 한 번도 안 불러왔으면 서버가 준 총 개수(childCount)와 미리보기 개수를
 * 비교하고, 한 번이라도 불러왔으면 응답의 last를 뒤집어 쓴다. 응답이 Slice라 남은 개수를 알 수
 * 없기 때문인데, 버튼에 개수를 표기하지 않는 정책이라 판정에는 지장이 없다.
 *
 * 이 컴포넌트가 미리보기와 추가 로드분을 모두 렌더한다 — 서버 렌더분을 children으로 받고
 * 추가분만 여기서 그리면 같은 줄을 두 벌로 그리게 되어 반드시 어긋난다.
 *
 * 줄 순서: 대댓글은 댓글 정렬과 상관없이 늘 단 순서(위가 먼저, 아래가 나중)다 — 답글은 대화라
 * 위에서 아래로 읽혀야 한다. 서버는 댓글 정렬 그대로 미리보기를 자르므로
 * - 작성된 순: 처음 3개가 오고, 「대댓글 더보기」는 아래에 붙어 뒤의 답글을 잇는다.
 * - 최신순: 마지막 3개가 오고, 「이전 대댓글 더보기」는 위에 붙어 앞의 답글을 위로 펼친다.
 *   그래서 방금 단 답글은 묶음 맨 아래, 입력창에 가장 가까운 자리에 바로 보인다.
 *
 * 펼쳐 둔 채 서버 렌더가 다시 돌면(답글 등록·삭제·신고·차단) 이어 받은 페이지를 버리지 않고
 * 같은 범위를 다시 받아 바꿔 끼운다(댓글 목록과 같은 방식). 다시 받는 동안은 옛 줄이 그대로 보인다.
 * 정렬·로그인이 바뀔 때만 접는다.
 *
 * 작성된 순에서 대댓글이 3개를 넘고 접혀 있으면 방금 단 답글은 뒤라 바로 안 보인다 — 그 한 경우를
 * 위해 답글을 달 때마다 자동 요청을 깔지 않기로 했다. 그때는 「대댓글 더보기」로 본다.
 */
export function CommentReplies({
  parentId,
  sort,
  totalCount,
  replies,
  postAuthorId,
}: {
  /** 이 묶음의 부모(최상위) 댓글 id. */
  parentId: number;
  /** 댓글 목록과 같은 정렬 — 서버가 미리보기를 이 정렬로 자르므로 이어 받기도 같아야 중복·누락이 없다. */
  sort: CommentSort;
  /** 서버가 준 답글 총 개수(childCount). 첫 더보기 노출 판정에 쓴다. */
  totalCount: number;
  /** 서버가 함께 내려준 미리보기(정렬 기준 상위 3개). */
  replies: Comment[];
  /** 게시글 작성자 id — 추가 로드분의 "작성자" 배지 판정용. 밸런스 게임은 작성자가 없어 생략한다. */
  postAuthorId?: number | null;
}) {
  // 정렬이 바뀌면 이어 받은 페이지의 범위 자체가 달라져 버린다.
  // 로그인 전환도 버린다 — 비로그인으로 받은 추가분은 좋아요 · 소유자가 전부 "아님"이다(#173).
  const { loginCount } = useAuth();
  const resetKey = `${sort}:${loginCount}`;
  const [state, setState] = useState(() => initialState(resetKey, replies));

  // 이번 렌더에서 유효한 상태(렌더 중 setState — prop 변경 시 상태 조정 패턴, CommentList와 같다).
  // - 정렬·로그인이 바뀌었으면 통째로 새로 시작한다.
  // - 미리보기만 바뀌었으면(서버 렌더 재실행) 펼친 건 두고, 옛 미리보기를 붙들어 둔 채 다시 받기를 건다.
  let current = state;
  if (current.resetKey !== resetKey) {
    current = initialState(resetKey, replies);
  } else if (current.preview !== replies) {
    const expanded = current.pages.length > 0;
    current = {
      ...current,
      preview: replies,
      carry: expanded ? [...current.preview, ...current.carry] : [],
      // 펼치지 않았어도 올린다 — 서버 렌더 전에 보낸 더보기 응답(밀리기 전 기준)을 버리는 표식이기도 하다.
      generation: current.generation + 1,
    };
  }
  if (current !== state) {
    setState(current);
  }

  // 새 데이터가 앞에 오게 모아 중복을 지운 뒤(먼저 온 것이 남는다), 단 순서로 줄 세운다.
  const items = dedupeById([
    ...replies,
    ...current.pages.flat(),
    ...current.carry,
  ]).sort(byPostedOrder);
  const hasMore = current.hasNext ?? totalCount > replies.length;
  // 최신순은 앞의(오래된) 답글이 남아 있으므로 버튼이 위로 간다.
  const loadsEarlier = sort === "latest";

  // 서버 렌더가 다시 돌면 이어 받은 범위(page 0..n-1)를 다시 받아 바꿔 끼운다.
  // 최신 상태는 ref로 본다 — 이 effect는 generation이 바뀔 때만 돌아야 해서 상태를 deps에 넣지 않는다.
  const latestRef = useRef({ current, parentId, sort, postAuthorId });
  useEffect(() => {
    latestRef.current = { current, parentId, sort, postAuthorId };
  });
  useEffect(() => {
    const { current, parentId, sort, postAuthorId } = latestRef.current;
    const count = current.pages.length;
    if (current.generation === 0 || count === 0) return;

    const { resetKey, generation } = current;
    // 지금까지 펼친 끝 줄(서버 정렬 기준 마지막 — 최신순이면 가장 오래된 줄, 작성된 순이면 가장 새 줄).
    // 앞쪽에 답글이 늘면 같은 페이지 수로는 이 줄이 다음 페이지로 밀려나므로, 이 줄이 다시 나올 때까지
    // 더 받는다 — 안 그러면 펼친 끝 줄이 사라지고 더보기 버튼이 다시 생긴다.
    // 끝까지 펼쳐 둔 상태였다면 끝 줄을 찾아도 남은 페이지까지 받는다 — 작성된 순에서 방금 단 답글이
    // 다음 페이지로 넘어간 경우다. 지워져 영영 안 나오는 경우를 위해 두 페이지까지만 더 받는다.
    const loaded = [...current.pages.flat(), ...current.carry];
    const edgeId = loaded.reduce<Comment | undefined>((edge, reply) => {
      if (!edge) return reply;
      const newer = byPostedOrder(reply, edge) > 0;
      return sort === "latest" ? (newer ? edge : reply) : newer ? reply : edge;
    }, undefined)?.id;
    const hadAll = current.hasNext === false;
    const MAX_EXTRA_PAGES = 2;

    async function refetch() {
      const results = await Promise.all(
        Array.from({ length: count }, (_, page) =>
          fetchReplyPage(parentId, sort, page),
        ),
      );
      // 한 페이지라도 실패하면 옛 줄을 그대로 둔다 — 일부만 바꾸면 페이지 경계가 어긋난다.
      if (results.some((result) => !result)) return null;
      const fresh = results as { items: Comment[]; hasNext: boolean }[];

      for (let extra = 0; extra < MAX_EXTRA_PAGES; extra += 1) {
        const last = fresh[fresh.length - 1];
        const reachedEdge =
          edgeId === undefined ||
          fresh.some((page) => page.items.some((reply) => reply.id === edgeId));
        if (!last.hasNext || (reachedEdge && !hadAll)) break;
        const next = await fetchReplyPage(parentId, sort, fresh.length);
        if (!next) break;
        fresh.push(next);
      }
      return fresh;
    }

    void refetch().then((fresh) => {
      if (!fresh) return;

      const marked = fresh.map((page) => ({
        ...page,
        items: markPostAuthorComments(page.items, postAuthorId),
      }));
      // 더 받은 페이지는 펼친 범위를 넘을 수 있다. 끝까지 펼쳐 뒀던 게 아니면 끝 줄까지만 보이고
      // (누르지 않은 옛 답글이 저절로 펼쳐지지 않게) 페이지로는 세지 않는다 — 다음 더보기가 그 페이지를
      // 다시 받고, 겹치는 줄은 dedupe가 지운다.
      const base = hadAll ? marked : marked.slice(0, count);
      const overflow = hadAll
        ? []
        : marked.slice(count).flatMap((p) => p.items);
      const edgeIndex = overflow.findIndex((reply) => reply.id === edgeId);
      const keep = edgeIndex >= 0 ? overflow.slice(0, edgeIndex + 1) : [];
      // 잘라 낸 줄이 남았으면 더보기로 닿을 수 있어야 한다.
      const freshHasNext =
        overflow.length > keep.length || marked[marked.length - 1].hasNext;

      setState((prev) => {
        // 받는 사이 정렬이 바뀌었거나 또 새로 고쳐졌으면 이번 결과는 버린다(다음 다시 받기가 맞는다).
        if (prev.resetKey !== resetKey || prev.generation !== generation)
          return prev;
        // 다시 받는 사이 더 받은 페이지는 남긴다(다시 받은 범위 뒤쪽만 — 앞은 fresh가 같은 자리다).
        const tail = prev.pages.slice(base.length);
        return {
          ...prev,
          pages: [...base.map((page) => page.items), ...tail],
          carry: keep,
          hasNext: tail.length > 0 ? prev.hasNext : freshHasNext,
        };
      });
    });
  }, [current.generation]);

  // 더보기로 새로 붙은 줄만 차례로 떠오르게 한다(처음 그려진 미리보기·새로고침으로 바뀐 목록은 그대로).
  // 줄(li)은 CommentItem이 그려 클래스를 넘길 수 없어, 커밋 직후 새 줄에만 애니메이션을 직접 건다.
  // 최신순에선 새 줄이 위에 끼므로 개수가 아니라 id로 고른다 — 더보기 응답에서 받은 id만 움직인다.
  const listRef = useRef<HTMLUListElement>(null);
  const arrivingIdsRef = useRef<Set<number>>(new Set());
  useLayoutEffect(() => {
    const arriving = arrivingIdsRef.current;
    const list = listRef.current;
    if (arriving.size === 0 || !list) return;
    arrivingIdsRef.current = new Set();
    // motion-safe와 같은 조건 — 동작 줄이기를 켠 사용자에게는 바로 보여준다.
    if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches)
      return;

    let order = 0;
    items.forEach((item, index) => {
      if (!arriving.has(item.id)) return;
      const el = list.children[index] as HTMLElement | undefined;
      if (!el) return;
      // 토큰(reply-rise-in 450ms) 그대로 — 한 줄씩 100ms 간격으로 이어서 떠오른다.
      el.style.animation = "var(--animate-reply-rise-in)";
      el.style.animationDelay = `${order * 100}ms`;
      order += 1;
      // 끝나면 지운다 — 남겨 두면 이 줄에 걸릴 다른 모션(방금 등록한 댓글 펼침)을 가린다.
      // animationend는 버블링되므로 줄 안쪽 아이콘 모션이 끝난 것과 구분한다.
      const clear = (event: AnimationEvent) => {
        if (event.target !== el) return;
        el.style.animation = "";
        el.style.animationDelay = "";
        el.removeEventListener("animationend", clear);
      };
      el.addEventListener("animationend", clear);
    });
  });

  async function loadNextPage() {
    if (current.status === "loading") return;

    const { resetKey, generation } = current;
    const page = current.pages.length;
    setState({ ...current, status: "loading" });

    const result = await fetchReplyPage(parentId, sort, page);

    setState((prev) => {
      // 받는 사이 정렬·로그인이 바뀌었으면 버린다.
      if (prev.resetKey !== resetKey) return prev;
      // 받는 사이 서버 렌더가 다시 돌았으면(답글 등록 등) 이 응답은 밀리기 전 기준이라 경계에서
      // 한 줄이 빠지거나 겹친다 — 버리고 버튼을 되돌린다. 다시 누르면 새 기준으로 받는다.
      if (prev.generation !== generation) return { ...prev, status: "idle" };
      // 같은 페이지를 두 번 받은 경우(연타) 뒤의 것은 버린다 — 붙이면 다음 요청이 한 페이지를 건너뛴다.
      if (prev.pages.length !== page) return prev;
      // 실패해도 지금까지 받은 것은 남긴다 — 버튼만 "다시 시도"로 바뀌고 목록은 그대로다.
      if (!result) return { ...prev, status: "failed" };

      // 응답에 "작성자" 필드가 없어 서버 렌더 경로와 같은 규칙으로 채운다 — 안 하면 더보기로 불러온 줄만 배지가 빠진다.
      const loaded = markPostAuthorComments(result.items, postAuthorId);
      const shown = new Set(
        [...prev.preview, ...prev.pages.flat(), ...prev.carry].map(
          (reply) => reply.id,
        ),
      );
      arrivingIdsRef.current = new Set(
        loaded.map((reply) => reply.id).filter((id) => !shown.has(id)),
      );

      return {
        ...prev,
        pages: [...prev.pages, loaded],
        hasNext: result.hasNext,
        status: "idle",
      };
    });
  }

  // 답글이 하나도 없으면 자리도 만들지 않는다.
  if (items.length === 0 && !hasMore) return null;

  const moreButton = hasMore ? (
    <button
      type="button"
      onClick={() => void loadNextPage()}
      disabled={current.status === "loading"}
      // 높이 19 고정. 텍스트는 대댓글 본문 좌측과 정렬 → 아바타 24 + gap 4 = 28 들여쓰기(pl-7).
      // 폰트 Body M, 색 comment-replies-text.
      // 눌렀을 때 살짝 옅어져 눌림을 알린다(면·테두리 없는 글자 버튼이라 투명도로만).
      className="flex h-[19px] items-center self-start pl-7 text-body-m text-comment-replies-text motion-safe:transition-opacity motion-safe:duration-150 active:opacity-60"
    >
      {current.status === "idle" && loadsEarlier
        ? "이전 대댓글 더보기"
        : BUTTON_LABEL[current.status]}
    </button>
  ) : null;

  return (
    // 묶음 안 간격 8 — 목록의 묶음 사이 간격(24)보다 확실히 좁아야 부모 댓글에 붙어 보인다(#258).
    <div className="mt-2 flex flex-col gap-2">
      {loadsEarlier ? moreButton : null}
      <ul ref={listRef} className="flex flex-col gap-2">
        {items.map((reply) => (
          <CommentItem
            key={reply.id}
            comment={reply}
            sort={sort}
            postAuthorId={postAuthorId}
            isReply
            threadId={parentId}
          />
        ))}
      </ul>
      {loadsEarlier ? null : moreButton}
    </div>
  );
}
