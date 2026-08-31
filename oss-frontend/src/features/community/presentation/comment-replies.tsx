"use client";

import { Children, useState, type ReactNode } from "react";

import { useCommentReply } from "@/features/community/presentation/comment-reply-context";

/** 펼치기 전 노출할 대댓글 수 — 정책상 3개. */
const INITIAL_VISIBLE = 3;

/**
 * 대댓글 묶음 (클라이언트 leaf).
 *
 * 서버에서 렌더한 대댓글(CommentItem) 요소들을 children으로 받아, 최초엔 3개만 보여주고
 * 더 있으면 "대댓글 N개 더보기"를 노출한다. N은 서버 replyCount 기준으로 센다 —
 * childrenList가 상위 N개만 내려오는 잘린 목록이라 화면에 들어온 개수로는 셀 수 없다.
 * (서버 컴포넌트를 children으로 받는 RSC 패턴 — CommentItem은 서버 유지)
 *
 * 방금 이 댓글에 답글을 달았다면 자동으로 펼친다 — 접힌 상태면 내가 쓴 답글이 안 보이기 때문.
 *
 * FIXME(정책): 더보기는 별도 "대댓글 더보기" 화면으로 이동해야 한다. 그 화면이 아직 없어
 *   현재는 내려온 목록만 인라인으로 펼친다 — 서버가 목록을 자르기 시작하면 전체를 못 본다.
 */
export function CommentReplies({
  commentId,
  totalCount,
  children,
}: {
  /** 이 묶음의 부모(최상위) 댓글 id — 방금 답글을 단 대상인지 판단용. */
  commentId: number;
  /** 서버가 준 답글 총 개수(replyCount). 더보기 버튼의 N을 여기서 센다. */
  totalCount: number;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const { justRepliedTo } = useCommentReply();
  const items = Children.toArray(children);
  // 내려온 개수가 아니라 서버 총 개수 기준 — 잘린 목록에서도 버튼이 정상 노출되도록.
  const hiddenCount = Math.max(totalCount, items.length) - INITIAL_VISIBLE;
  const open = expanded || justRepliedTo === commentId;
  const visible = open ? items : items.slice(0, INITIAL_VISIBLE);

  return (
    <div className="mt-3 flex flex-col gap-3">
      <ul className="flex flex-col gap-3">{visible}</ul>
      {!open && hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          // 높이 19 고정. 텍스트는 대댓글 본문 좌측과 정렬 → 아바타 24 + gap 4 = 28 들여쓰기(pl-7).
          // 폰트 Body M, 색 comment-replies-text.
          className="flex h-[19px] items-center self-start pl-7 text-body-m text-comment-replies-text"
        >
          대댓글 {hiddenCount}개 더보기
        </button>
      ) : null}
    </div>
  );
}
