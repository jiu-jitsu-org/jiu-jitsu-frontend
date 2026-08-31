import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";
import { AlertTriangleIcon, ReplyBranchIcon } from "@/shared/ui/icons";

/**
 * 본문을 가린 댓글 자리 표시 (서버 컴포넌트).
 *
 * WHY 제거가 아니라 자리를 남기는가: 댓글을 통째로 걷어내면 그 아래 대댓글이 부모를 잃어
 * 스레드가 끊긴다. 게시글은 완전 비노출이지만 댓글은 자리를 남기는 것이 확정 정책이다.
 *
 * 신고(#48) · 삭제(#61) · 차단(#53)이 같은 표현을 쓰고 문구만 다르므로 message를 받는다.
 * 문구는 호출부가 소유한다 — 상황을 아는 쪽이 여기다.
 *
 * 구성은 [경고 아이콘 16] + [문구] 한 줄이다. 아바타·닉네임은 노출하지 않는다 —
 * 차단한 상대가 아바타로 드러나면 차단의 의미가 사라진다. 상호작용(⋮ · 좋아요 · 답글)도
 * 노출하지 않는다 — 가려진 대상에 다시 취할 동작이 없다.
 *
 * 색은 comment-tombstone/{icon,text} 토큰이 단일 출처다(둘 다 #70737C로 해석되지만,
 * 디자인이 아이콘·텍스트를 분리해 정의했으므로 코드에서도 분리해 둔다).
 */
export function CommentPlaceholder({
  message,
  isReply = false,
  children,
}: {
  message: string;
  /** 대댓글이면 문구 영역 앞에 분기 아이콘을 붙인다(CommentItem과 동일). */
  isReply?: boolean;
  /** 이 댓글에 달린 대댓글 — 부모가 가려져도 그대로 노출한다. */
  children?: ReactNode;
}) {
  return (
    // 대댓글: -ml-7(28)로 왼쪽 28을 되찾아 분기 아이콘(24) + gap 4 = 28을 그 자리에 채운다.
    // CommentItem과 동일한 보정이라 원문·placeholder가 섞여도 들여쓰기가 어긋나지 않는다.
    <li className={cn("flex flex-col", isReply && "-ml-7")}>
      {/* 컨테이너 높이 35 고정. 분기 아이콘(24)·문구 영역(19)은 높이가 달라 상단 정렬로 맞춘다
          — 대댓글이든 아니든 한 행이 차지하는 높이는 35로 같다. 좌우 16은 CommentSection(px-4) 담당. */}
      <div className="flex h-[35px] items-start gap-1">
        {isReply ? (
          // 위에서 내려와 오른쪽으로 꺾이는 연결선 — 이 행이 위 댓글의 대댓글임을 나타낸다.
          <ReplyBranchIcon
            size={24}
            className="shrink-0 text-comment-thread-line-stroke"
          />
        ) : null}
        {/* 문구 영역 19 — 아이콘(16)은 이 안에서 문구 기준 수직 가운데 정렬.
            댓글 케이스는 분기 아이콘이 없어 아이콘이 컨테이너에 붙으므로 좌측 4를 띄운다. */}
        <div
          className={cn(
            "flex min-h-[19px] min-w-0 flex-1 items-center gap-1 text-comment-tombstone-text",
            !isReply && "ml-1",
          )}
        >
          <AlertTriangleIcon
            size={16}
            className="shrink-0 text-comment-tombstone-icon"
          />
          {/* Body M(16 Medium / 19) */}
          <p className="min-w-0 flex-1 text-body-m leading-[19px]">
            {message}
          </p>
        </div>
      </div>
      {/* 대댓글은 아이콘 열이 아니라 원문과 같은 콘텐츠 컬럼(아바타 24 + gap 4 = 28)에서 시작한다.
          이 컴포넌트의 문구 열은 24(좌측 4 + 아이콘 16 + gap 4)라, 자식을 문구 열에 붙이면
          정상 댓글 아래 대댓글보다 4 왼쪽으로 밀린다. 그래서 자식만 pl-7로 따로 28에 맞춘다. */}
      {children ? <div className="pl-7">{children}</div> : null}
    </li>
  );
}
