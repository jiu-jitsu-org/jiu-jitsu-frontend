"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { useAuth } from "@/features/auth/presentation/auth-provider";
import type { Comment } from "@/features/community/domain/comment";
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
  /** 이 상태가 어떤 서버 데이터 위에 쌓인 것인지 — 달라지면 통째로 버린다. */
  signature: string;
  /** 미리보기 뒤에 이어 붙인 추가 로드분. */
  loaded: Comment[];
  /** 다음에 요청할 페이지 번호(0부터). */
  nextPage: number;
  /** 서버가 알려준 다음 페이지 존재 여부. null이면 아직 한 번도 부르지 않았다. */
  hasNext: boolean | null;
  status: keyof typeof BUTTON_LABEL;
};

function initialState(signature: string): RepliesState {
  return { signature, loaded: [], nextPage: 0, hasNext: null, status: "idle" };
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

/**
 * 추가로 불러온 대댓글에 "작성자" 배지를 채운다.
 *
 * 응답에 "댓글 작성자 == 게시글 작성자" 필드가 없어 서버 렌더 경로(get-post-detail-page-data)도
 * id를 비교해 도출한다. 같은 규칙을 여기서도 적용하지 않으면 더보기로 불러온 줄만 배지가 빠진다.
 */
function markPostAuthor(
  replies: Comment[],
  postAuthorId: number | null | undefined,
): Comment[] {
  if (!postAuthorId) return replies;

  return replies.map((reply) => ({
    ...reply,
    isPostAuthor: reply.author.userId === postAuthorId,
  }));
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
 * 답글 등록 직후 자동 펼침(옛 justRepliedTo)은 두지 않는다. 서버가 미리보기를 자르기 전에는
 * "이미 받아둔 걸 펼치기"라 공짜였지만 지금은 추가 요청이 든다. 기본 정렬(최신순)에서는 새 답글이
 * 미리보기 맨 앞에 와서 그냥 보이고, 작성된 순에서 대댓글이 3개를 넘을 때만 맨 뒤로 밀린다 —
 * 그 한 경우 때문에 답글을 달 때마다 자동 요청을 깔지 않기로 했다. 그때는 「대댓글 더보기」로 본다.
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
  /** 댓글 목록과 같은 정렬 — 다르면 이미 본 대댓글이 다시 오거나 빠진다. */
  sort: CommentSort;
  /** 서버가 준 답글 총 개수(childCount). 첫 더보기 노출 판정에 쓴다. */
  totalCount: number;
  /** 서버가 함께 내려준 미리보기(상위 3개). */
  replies: Comment[];
  /** 게시글 작성자 id — 추가 로드분의 "작성자" 배지 판정용. 밸런스 게임은 작성자가 없어 생략한다. */
  postAuthorId?: number | null;
}) {
  // 정렬이 바뀌거나 router.refresh로 미리보기가 갱신되면 쌓아둔 추가 로드분은 무효다.
  // 로그인 전환도 무효 사유다 — 비로그인으로 받은 추가분은 좋아요 · 소유자가 전부 "아님"이다(#173).
  const { loginCount } = useAuth();
  const signature = `${sort}:${totalCount}:${loginCount}:${replies.map((reply) => reply.id).join(",")}`;
  const [state, setState] = useState(() => initialState(signature));

  // 이번 렌더에서 유효한 상태. 서버 데이터가 바뀐 렌더에서는 새 상태를 바로 쓰고,
  // 커밋된 state도 맞춰 되돌린다(렌더 중 setState — prop 변경 시 상태 리셋 패턴).
  const current = state.signature === signature ? state : initialState(signature);
  if (state.signature !== signature) {
    setState(current);
  }

  const items = dedupeById([...replies, ...current.loaded]);
  const hasMore = current.hasNext ?? totalCount > replies.length;

  // 더보기로 새로 붙은 줄만 차례로 떠오르게 한다(처음 그려진 미리보기·새로고침으로 바뀐 목록은 그대로).
  // 줄(li)은 CommentItem이 그려 클래스를 넘길 수 없어, 커밋 직후 새 줄에만 애니메이션을 직접 건다.
  // 직전 커밋의 줄 수·signature를 기억해 두고, 같은 signature에서 줄이 늘었을 때만 늘어난 부분을 움직인다.
  const listRef = useRef<HTMLUListElement>(null);
  const renderedRef = useRef<{ signature: string; count: number } | null>(null);
  useLayoutEffect(() => {
    const list = listRef.current;
    const count = list?.children.length ?? 0;
    const previous = renderedRef.current;
    renderedRef.current = { signature, count };
    if (!list || !previous || previous.signature !== signature) return;
    if (count <= previous.count) return;
    // motion-safe와 같은 조건 — 동작 줄이기를 켠 사용자에게는 바로 보여준다.
    if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches)
      return;

    Array.from(list.children)
      .slice(previous.count)
      .forEach((child, index) => {
        const el = child as HTMLElement;
        // 토큰(reply-rise-in 450ms) 그대로 — 한 줄씩 100ms 간격으로 이어서 떠오른다.
        el.style.animation = "var(--animate-reply-rise-in)";
        el.style.animationDelay = `${index * 100}ms`;
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
  }, [signature, items.length]);

  async function loadNextPage() {
    if (current.status === "loading") return;

    setState({ ...current, status: "loading" });

    const result = await fetchReplyPage(parentId, sort, current.nextPage);

    // 실패해도 지금까지 받은 것은 남긴다 — 버튼만 "다시 시도"로 바뀌고 목록은 그대로다.
    if (!result) {
      setState({ ...current, status: "failed" });
      return;
    }

    setState({
      signature,
      loaded: dedupeById([
        ...current.loaded,
        ...markPostAuthor(result.items, postAuthorId),
      ]),
      nextPage: current.nextPage + 1,
      hasNext: result.hasNext,
      status: "idle",
    });
  }

  // 답글이 하나도 없으면 자리도 만들지 않는다.
  if (items.length === 0 && !hasMore) return null;

  return (
    // 묶음 안 간격 8 — 목록의 묶음 사이 간격(24)보다 확실히 좁아야 부모 댓글에 붙어 보인다(#258).
    <div className="mt-2 flex flex-col gap-2">
      <ul ref={listRef} className="flex flex-col gap-2">
        {items.map((reply) => (
          <CommentItem
            key={reply.id}
            comment={reply}
            sort={sort}
            postAuthorId={postAuthorId}
            isReply
          />
        ))}
      </ul>
      {hasMore ? (
        <button
          type="button"
          onClick={() => void loadNextPage()}
          disabled={current.status === "loading"}
          // 높이 19 고정. 텍스트는 대댓글 본문 좌측과 정렬 → 아바타 24 + gap 4 = 28 들여쓰기(pl-7).
          // 폰트 Body M, 색 comment-replies-text.
          // 눌렀을 때 살짝 옅어져 눌림을 알린다(면·테두리 없는 글자 버튼이라 투명도로만).
          className="flex h-[19px] items-center self-start pl-7 text-body-m text-comment-replies-text motion-safe:transition-opacity motion-safe:duration-150 active:opacity-60"
        >
          {BUTTON_LABEL[current.status]}
        </button>
      ) : null}
    </div>
  );
}
