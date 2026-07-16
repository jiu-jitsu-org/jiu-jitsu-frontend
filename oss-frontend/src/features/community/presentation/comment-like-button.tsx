"use client";

import { useState } from "react";

import { useIsDemoMode } from "@/features/community/presentation/community-demo-context";
import { bffFetch } from "@/shared/lib/http/bff-fetch";
import { cn } from "@/shared/lib/cn";
import { OutboundMessageType, postToNative } from "@/shared/lib/native-bridge";
import { HeartIcon } from "@/shared/ui/icons";

/**
 * 댓글 좋아요 버튼 (클라이언트 leaf).
 *
 * 게시글 좋아요(usePostActions)와 동일 철학의 낙관적 토글: 즉시 fill/카운트를 바꾸고,
 * BFF POST /api/community/comments/{id}/likes 결과로 보정한다(실패 시 롤백). 401은 네이티브 로그인 유도.
 * 데모(예시) 모드는 네트워크 없이 낙관적 토글만 한다.
 *
 * 시각은 comment-item의 CommentReaction(좋아요)과 동일하게 유지 — 동작만 추가한다.
 */
export function CommentLikeButton({
  commentId,
  initialLiked,
  initialLikeCount,
}: {
  commentId: number;
  initialLiked: boolean;
  initialLikeCount: number;
}) {
  const demo = useIsDemoMode();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialLikeCount);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (pending) return;

    const prevLiked = liked;
    const prevCount = count;
    const next = !prevLiked;

    // 낙관적 반영
    setLiked(next);
    setCount(prevCount + (next ? 1 : -1));

    if (demo) return;

    setPending(true);
    try {
      const response = await bffFetch(
        `/api/community/comments/${commentId}/likes`,
        { method: "POST" },
      );

      if (!response.ok) {
        if (response.status === 401) {
          postToNative({ type: OutboundMessageType.AUTH_LOGIN_PROMPT });
        }
        // 롤백
        setLiked(prevLiked);
        setCount(prevCount);
        return;
      }

      // 서버 권위값으로 보정(낙관적 결과와 다르면 카운트도 맞춘다).
      const body = (await response.json().catch(() => null)) as
        | { data?: { liked?: boolean } }
        | null;
      const authoritative = body?.data?.liked;
      if (typeof authoritative === "boolean" && authoritative !== next) {
        setLiked(authoritative);
        setCount(prevCount + (authoritative ? 1 : 0) - (prevLiked ? 1 : 0));
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      aria-label="좋아요"
      aria-pressed={liked}
      onClick={() => void toggle()}
      // 내가 누른 상태: 채워진 하트 + active 색 / 아니면: 빈 하트 + default 색.
      // 카운트 텍스트는 자체 색 클래스를 가져 버튼 색 변경의 영향을 받지 않는다.
      className={cn(
        "inline-flex h-7 items-center gap-1 px-2",
        liked
          ? "text-reaction-bar-active-like-icon"
          : "text-reaction-bar-default-icon",
      )}
    >
      <HeartIcon size={16} filled={liked} />
      <span className="text-sm leading-[21px] text-reaction-bar-default-count-text">
        {count > 0 ? count : "좋아요"}
      </span>
    </button>
  );
}
