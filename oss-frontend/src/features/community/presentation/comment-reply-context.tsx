"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { Comment } from "@/features/community/domain/comment";
import type { CommentSort } from "@/features/community/domain/post";

/** 답글 대상. parentId는 서버로 보낼 부모 댓글 id, nickname은 "○○님에게 답글" 표시용. */
export type ReplyTarget = {
  /**
   * 서버에 보낼 parentId — **항상 최상위 댓글 id**다.
   * 대댓글에 답글을 달아도 같은 줄에 붙도록 1단계로 고정한다(무한 중첩 방지).
   */
  parentId: number;
  /** 탭한 댓글 작성자 닉네임 — 대댓글에 답글을 달면 그 대댓글 작성자가 표시된다. */
  nickname: string;
  /**
   * 답글 버튼을 누른 대댓글 id(#473). 있으면 입력창 맨 앞에 `@닉네임 `을 미리 넣고(#451),
   * 전송 때 `mentionCommentId`로 함께 보내 그 대댓글 작성자에게 답글 알림이 가게 한다(backend#219).
   * 대댓글에 답할 때만 채운다 — 답글은 늘 최상위 스레드 끝에 붙으므로 누구에게 하는 말인지
   * 본문의 태그로 남겨야 대화가 이어진다. 최상위 댓글에 답할 땐 스레드 주인이 곧 대상이라 비워 두고,
   * 내 대댓글에 이어 쓸 때도 나를 태그하지 않아 비워 둔다 — 서버는 지금처럼 최상위 댓글 작성자에게 알린다.
   */
  mentionCommentId?: number;
};

type CommentReplyContextValue = {
  target: ReplyTarget | null;
  /** 답글 버튼 탭 → 대상 지정(입력바가 칩을 띄우고 포커스한다). */
  startReply: (target: ReplyTarget) => void;
  /** 칩 × 또는 등록 완료 → 대상 해제. */
  cancelReply: () => void;
  /** 방금 등록한 댓글 id — 목록에 처음 나타날 때 펼쳐지며 반짝이는 모션의 대상. */
  justPostedId: number | null;
  /** 입력 바가 등록 성공 직후 부른다. */
  markPosted: (id: number) => void;
  /**
   * 방금 등록한 댓글 — 서버 렌더(router.refresh)가 돌아오기 전에 목록이 먼저 그린다(#486).
   * 서버 것이 오면 그쪽이 이긴다. 서버 렌더가 바로 가져오는 자리(첫 페이지·첫 페이지 댓글의 미리보기)에
   * 넣은 사본은 서버 렌더가 오면 비운다 — 혹시 그 범위 밖으로 밀렸어도(그 사이 다른 사람 댓글 등) 사본이
   * 남아 서버와 어긋나지 않게(지워도 원문으로 보이는 등). 이어 받은 페이지·펼친 대댓글에 넣은 사본은
   * 서버 렌더 뒤 다시 받기가 끝나야 서버 것이 오므로, 그때까지(같은 id가 서버 목록에 들어올 때까지) 둔다.
   * 정렬이 바뀌면 끼운 자리가 맞지 않으니 모두 비운다.
   */
  posted: PostedComment[];
  /**
   * 등록 응답의 댓글을 목록에 넣는다. 지금 보이는 자리에 끼울 수 없으면(작성된 순에서 뒤 페이지를
   * 아직 안 받았거나 대댓글이 접혀 있으면) 넣지 않고 false — 입력 바가 대신 등록됐다고 알린다.
   */
  addPosted: (comment: Comment, parentId: number | undefined) => boolean;
  /**
   * 목록·대댓글 묶음이 "지금 맨 끝(또는 맨 위)에 끼울 수 있는지"를 알려 준다. 키는 최상위 목록이면
   * ROOT_PLACEMENT, 대댓글 묶음이면 부모 댓글 id. 돌려준 함수로 해제한다.
   */
  registerPlacement: (key: PlacementKey, placement: () => PostedSync | null) => () => void;
  /** 서버 목록에 들어온 사본을 지운다 — 가려 두기만 하면 정렬·다시 받기로 범위 밖에 나갈 때 옛 사본이 되살아난다. */
  settlePosted: (ids: number[]) => void;
};

/**
 * 방금 쓴 댓글의 서버 것이 무엇으로 오는지 — 서버 렌더가 바로 가져오는 자리면 "server-render",
 * 서버 렌더 뒤 이어 받은 페이지·펼친 대댓글을 다시 받아야 오는 자리면 "refetch".
 */
export type PostedSync = "server-render" | "refetch";

/** 방금 등록한 댓글과 그 부모(최상위 댓글이면 undefined), 서버 것이 오는 경로. */
export type PostedComment = {
  comment: Comment;
  parentId: number | undefined;
  syncedBy: PostedSync;
};

/** 최상위 댓글 목록의 자리 판정 키. 대댓글 묶음은 부모 댓글 id를 키로 쓴다. */
export const ROOT_PLACEMENT = "root";
type PlacementKey = typeof ROOT_PLACEMENT | number;

const CommentReplyContext = createContext<CommentReplyContextValue | null>(null);

/**
 * 답글 대상 공유 컨텍스트 (클라이언트).
 *
 * 답글 버튼(댓글 목록 안)과 입력 바(셸 footer)는 트리상 형제라 props로 상태를 넘길 수 없다.
 * 상세 화면 루트에서 이 Provider로 둘을 감싸 대상 댓글을 공유한다.
 */
export function CommentReplyProvider({
  serverComments,
  sort,
  children,
}: {
  /**
   * 서버 렌더가 내려준 댓글 첫 페이지. 값보다 "새로 왔는지"만 본다 — 서버 렌더가 다시 돌 때마다
   * (댓글 등록 뒤 refresh, 정렬 변경, 삭제·신고 등) 새 객체로 온다.
   */
  serverComments: unknown;
  /** 댓글 정렬 — 바뀌면 방금 쓴 댓글을 모두 비운다. */
  sort: CommentSort;
  children: ReactNode;
}) {
  const [target, setTarget] = useState<ReplyTarget | null>(null);
  const [justPostedId, setJustPostedId] = useState<number | null>(null);

  const startReply = useCallback((next: ReplyTarget) => {
    setTarget(next);
  }, []);

  const cancelReply = useCallback(() => {
    setTarget(null);
  }, []);

  const [posted, setPosted] = useState<PostedComment[]>([]);
  // 서버 렌더가 오면 그 렌더가 가져오는 자리의 사본을 비운다 — 렌더 중 상태 조정(prop 변경 시 상태 리셋 패턴,
  // CommentList와 같다). 범위 안이면 서버 목록에 들어 있고, 밖으로 밀렸으면 더보기·무한 스크롤로 닿는다.
  // 다시 받기를 기다리는 사본은 남긴다 — 여기서 비우면 다시 받기가 끝날 때까지(실패하면 계속) 빠진다.
  const [lastServerComments, setLastServerComments] = useState(serverComments);
  const [lastSort, setLastSort] = useState(sort);
  if (sort !== lastSort) {
    // 정렬이 바뀌면 목록·묶음이 처음부터 다시 그려진다 — 이전 정렬에서 판정한 자리는 의미가 없다.
    setLastSort(sort);
    setLastServerComments(serverComments);
    setPosted([]);
  } else if (serverComments !== lastServerComments) {
    setLastServerComments(serverComments);
    setPosted((prev) => prev.filter((entry) => entry.syncedBy === "refetch"));
  }
  // 자리 판정은 렌더와 상관없는 질문이라 ref에 둔다 — 등록할 때 한 번 묻고 끝난다.
  const placementsRef = useRef(new Map<PlacementKey, () => PostedSync | null>());

  const registerPlacement = useCallback(
    (key: PlacementKey, placement: () => PostedSync | null) => {
      const placements = placementsRef.current;
      placements.set(key, placement);
      return () => {
        if (placements.get(key) === placement) placements.delete(key);
      };
    },
    [],
  );

  const addPosted = useCallback(
    (comment: Comment, parentId: number | undefined) => {
      // 묶음이 아직 없으면(답글이 하나도 없던 댓글) 방금 쓴 답글이 첫 줄이라 늘 끼울 수 있다. 그 부모가
      // 어느 페이지에서 왔는지 몰라, 서버 목록에 같은 id가 들어올 때까지 두는 쪽으로 잡는다(미리보기에 늘 든다).
      const placement = placementsRef.current.get(parentId ?? ROOT_PLACEMENT);
      const syncedBy = placement ? placement() : "refetch";
      if (!syncedBy) return false;
      // 내가 방금 쓴 댓글이다 — 응답 값과 상관없이 ⋮ 메뉴가 내 댓글 메뉴로 뜨게 한다.
      setPosted((prev) => [
        ...prev,
        { comment: { ...comment, isOwner: true }, parentId, syncedBy },
      ]);
      return true;
    },
    [],
  );

  const settlePosted = useCallback((ids: number[]) => {
    setPosted((prev) => prev.filter((entry) => !ids.includes(entry.comment.id)));
  }, []);

  const value = useMemo(
    () => ({
      target,
      startReply,
      cancelReply,
      justPostedId,
      markPosted: setJustPostedId,
      posted,
      addPosted,
      registerPlacement,
      settlePosted,
    }),
    [
      target,
      startReply,
      cancelReply,
      justPostedId,
      posted,
      addPosted,
      registerPlacement,
      settlePosted,
    ],
  );

  return (
    <CommentReplyContext.Provider value={value}>
      {children}
    </CommentReplyContext.Provider>
  );
}

/**
 * 답글 대상 접근자.
 *
 * Provider 밖(예: 예시 페이지에서 일부 컴포넌트만 격리 렌더)에서도 터지지 않도록
 * 무동작 기본값을 돌려준다 — 답글 기능만 비활성될 뿐 화면은 그대로 뜬다.
 */
export function useCommentReply(): CommentReplyContextValue {
  return (
    useContext(CommentReplyContext) ?? {
      target: null,
      startReply: () => {},
      cancelReply: () => {},
      justPostedId: null,
      markPosted: () => {},
      posted: NO_POSTED,
      addPosted: () => false,
      registerPlacement: () => () => {},
      settlePosted: () => {},
    }
  );
}

const NO_POSTED: PostedComment[] = [];

/**
 * 자리 판정 등록 — 끼울 수 없으면 null, 있으면 서버 것이 오는 경로를 돌려준다.
 * 최신 판정을 ref로 들고 있어 판정 조건이 바뀌어도 다시 등록하지 않는다.
 */
export function usePlacement(
  key: PlacementKey,
  placement: () => PostedSync | null,
) {
  const { registerPlacement } = useCommentReply();
  const placementRef = useRef(placement);
  useEffect(() => {
    placementRef.current = placement;
  });
  useEffect(
    () => registerPlacement(key, () => placementRef.current()),
    [key, registerPlacement],
  );
}

/**
 * 서버 목록(shown)에 들어온 방금 쓴 댓글을 사본 목록에서 지운다 — 커밋 뒤에 지우므로 화면은 이미 서버 것을 그리고 있다.
 */
export function useSettlePosted(parentId: number | undefined, shown: Comment[]) {
  const { posted, settlePosted } = useCommentReply();
  useEffect(() => {
    const ids = new Set(shown.map((comment) => comment.id));
    const seen = posted
      .filter((entry) => entry.parentId === parentId && ids.has(entry.comment.id))
      .map((entry) => entry.comment.id);
    if (seen.length > 0) settlePosted(seen);
  });
}

/** 서버 목록에 아직 없는 방금 쓴 댓글만 고른다 — 서버 것이 먼저 오면 그쪽이 이긴다. */
export function postedNotIn(
  posted: PostedComment[],
  parentId: number | undefined,
  shown: Comment[],
): Comment[] {
  const ids = new Set(shown.map((comment) => comment.id));
  return posted
    .filter((entry) => entry.parentId === parentId && !ids.has(entry.comment.id))
    .map((entry) => entry.comment);
}
