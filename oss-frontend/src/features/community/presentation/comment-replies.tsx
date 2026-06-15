"use client";

import { Children, useState, type ReactNode } from "react";

/** 펼치기 전 노출할 대댓글 수. */
const INITIAL_VISIBLE = 2;

/**
 * 대댓글 묶음 (클라이언트 leaf).
 *
 * 서버에서 렌더한 대댓글(CommentItem) 요소들을 children으로 받아, 최초엔 2개만 보여주고
 * 더 있으면 "대댓글 N개 더보기"로 펼친다(탭하면 전체 나열). N = 숨겨진 개수.
 * (서버 컴포넌트를 children으로 받는 RSC 패턴 — CommentItem은 서버 유지)
 */
export function CommentReplies({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const items = Children.toArray(children);
  const hiddenCount = items.length - INITIAL_VISIBLE;
  const visible = expanded ? items : items.slice(0, INITIAL_VISIBLE);

  return (
    <div className="mt-3 flex flex-col gap-3">
      <ul className="flex flex-col gap-3">{visible}</ul>
      {!expanded && hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          // 높이 19 고정. 텍스트는 대댓글 본문 좌측과 정렬 → 아바타 24 + gap 4 = 28 들여쓰기(pl-7).
          // 폰트 Body M, 색 text-secondary.
          className="flex h-[19px] items-center self-start pl-7 text-base font-medium text-text-secondary"
        >
          대댓글 {hiddenCount}개 더보기
        </button>
      ) : null}
    </div>
  );
}
