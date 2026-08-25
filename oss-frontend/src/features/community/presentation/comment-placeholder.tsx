import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";
import { ReplyBranchIcon } from "@/shared/ui/icons";

/**
 * 본문을 가린 댓글 자리 표시 (서버 컴포넌트).
 *
 * WHY 제거가 아니라 자리를 남기는가: 댓글을 통째로 걷어내면 그 아래 대댓글이 부모를 잃어
 * 스레드가 끊긴다. 게시글은 완전 비노출이지만 댓글은 자리를 남기는 것이 확정 정책이다.
 *
 * 신고(#48) · 삭제(#61) · 차단(#53)이 같은 표현을 쓰고 문구만 다르므로 message를 받는다.
 * 문구는 호출부가 소유한다 — 상황을 아는 쪽이 여기다.
 *
 * 레이아웃은 CommentItem과 맞춘다: 아바타 자리에 같은 크기의 빈 공간을 두어 콘텐츠 컬럼의
 * x 좌표를 유지한다. 그래야 자식 대댓글의 들여쓰기가 부모가 가려져도 어긋나지 않는다.
 * 상호작용(⋮ · 좋아요 · 답글)은 노출하지 않는다 — 가려진 대상에 다시 취할 동작이 없다.
 */
export function CommentPlaceholder({
  message,
  isReply = false,
  children,
}: {
  message: string;
  /** 대댓글이면 아바타 앞에 분기 아이콘을 붙인다(CommentItem과 동일). */
  isReply?: boolean;
  /** 이 댓글에 달린 대댓글 — 부모가 가려져도 그대로 노출한다. */
  children?: ReactNode;
}) {
  return (
    <li className={cn("flex gap-1", isReply && "-ml-7")}>
      {isReply ? (
        <ReplyBranchIcon
          size={24}
          className="shrink-0 self-start text-feed-card-header-avatar-bg"
        />
      ) : null}
      {/* 아바타(24) 자리를 비워 둔다 — 작성자를 드러내지 않으면서 콘텐츠 컬럼 정렬은 유지. */}
      <div aria-hidden className="size-6 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 프로필 행(24) + 본문 상단 간격(7)을 합친 높이를 한 줄로 대신한다 —
            가려진 댓글이 원문만큼 자리를 차지하면 목록이 성겨 보인다. */}
        <p className="flex min-h-6 items-center text-sm leading-[21px] text-text-tertiary">
          {message}
        </p>
        {children}
      </div>
    </li>
  );
}
