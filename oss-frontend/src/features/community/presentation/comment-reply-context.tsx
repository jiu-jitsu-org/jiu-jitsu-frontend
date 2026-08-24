"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** 답글 대상. parentId는 서버로 보낼 부모 댓글 id, nickname은 "○○님에게 답글" 표시용. */
export type ReplyTarget = {
  /**
   * 서버에 보낼 parentId — **항상 최상위 댓글 id**다.
   * 대댓글에 답글을 달아도 같은 줄에 붙도록 1단계로 고정한다(무한 중첩 방지).
   */
  parentId: number;
  /** 탭한 댓글 작성자 닉네임 — 대댓글에 답글을 달면 그 대댓글 작성자가 표시된다. */
  nickname: string;
};

type CommentReplyContextValue = {
  target: ReplyTarget | null;
  /** 답글 버튼 탭 → 대상 지정(입력바가 칩을 띄우고 포커스한다). */
  startReply: (target: ReplyTarget) => void;
  /** 칩 × 또는 등록 완료 → 대상 해제. */
  cancelReply: () => void;
  /**
   * 방금 답글이 달린 최상위 댓글 id.
   * 대댓글이 접혀 있으면 새로 단 답글이 안 보이므로, 이 값으로 해당 묶음만 펼친다.
   */
  justRepliedTo: number | null;
  completeReply: (parentId: number) => void;
};

const CommentReplyContext = createContext<CommentReplyContextValue | null>(null);

/**
 * 답글 대상 공유 컨텍스트 (클라이언트).
 *
 * 답글 버튼(댓글 목록 안)과 입력 바(셸 footer)는 트리상 형제라 props로 상태를 넘길 수 없다.
 * 상세 화면 루트에서 이 Provider로 둘을 감싸 대상 댓글을 공유한다.
 */
export function CommentReplyProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<ReplyTarget | null>(null);
  const [justRepliedTo, setJustRepliedTo] = useState<number | null>(null);

  const startReply = useCallback((next: ReplyTarget) => {
    setTarget(next);
  }, []);

  const cancelReply = useCallback(() => {
    setTarget(null);
  }, []);

  const completeReply = useCallback((parentId: number) => {
    setTarget(null);
    setJustRepliedTo(parentId);
  }, []);

  const value = useMemo(
    () => ({ target, startReply, cancelReply, justRepliedTo, completeReply }),
    [target, startReply, cancelReply, justRepliedTo, completeReply],
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
      justRepliedTo: null,
      completeReply: () => {},
    }
  );
}
