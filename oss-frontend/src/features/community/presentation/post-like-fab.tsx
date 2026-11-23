"use client";

import { useEffect, useState } from "react";

import {
  REACTION_POP_MOTION,
  REACTION_PRESS_MOTION,
} from "@/features/community/presentation/comment-reaction-styles";
import { COMMENT_INPUT_ELEMENT_ID } from "@/features/community/presentation/comment-input-bar";
import { useDetailPostActions } from "@/features/community/presentation/post-action-bar";
import { useLoginGuard } from "@/features/community/presentation/use-login-guard";
import { usePopOnActivate } from "@/features/community/presentation/use-pop-on-activate";
import { useViewportRect } from "@/features/community/presentation/use-viewport-rect";
import { cn } from "@/shared/lib/cn";
import { useIsExternalBrowser } from "@/shared/lib/native-bridge";
import { HeartIcon } from "@/shared/ui/icons";

/**
 * 글 상세에 떠 있는 좋아요 버튼 — 댓글 입력 바 12 위, 오른쪽 12(글쓰기 버튼과 같은 48 원·눌림).
 *
 * 글을 내려 읽는 동안에도 바로 좋아요를 누르게 한다. 액션바의 좋아요와 같은 상태·로그인 안내를 쓴다(PostActionsProvider).
 * 좋아요 수는 액션바와 같은 규칙 — 1 이상이면 하트 옆에 숫자를 붙여 옆으로 늘어난다.
 * 댓글을 쓰는 동안(입력창 포커스 · 키보드)은 감춘다 — 입력 바 바로 위라 쓰는 글을 가린다.
 * 입력 바를 감싼 상자 기준(bottom-full)이라 답글 줄이 열려 바가 높아져도 그 위에 붙는다.
 */
export function PostLikeFab() {
  const { liked, likes, toggleLike } = useDetailPostActions();
  const { guard } = useLoginGuard();
  const pop = usePopOnActivate(liked);
  const keyboardOpen = useViewportRect()?.keyboardOpen ?? false;
  const [writing, setWriting] = useState(false);

  useEffect(() => {
    const onFocusChange = (event: FocusEvent) => {
      if ((event.target as Element | null)?.id !== COMMENT_INPUT_ELEMENT_ID)
        return;
      setWriting(event.type === "focusin");
    };
    document.addEventListener("focusin", onFocusChange);
    document.addEventListener("focusout", onFocusChange);
    return () => {
      document.removeEventListener("focusin", onFocusChange);
      document.removeEventListener("focusout", onFocusChange);
    };
  }, []);

  const hidden = writing || keyboardOpen;

  return (
    <div
      aria-hidden={hidden}
      inert={hidden}
      className={cn(
        "absolute right-3 bottom-full mb-3 motion-safe:transition-[opacity,translate] motion-safe:duration-500 motion-safe:ease-smooth-out",
        hidden && "pointer-events-none translate-y-2 opacity-0",
      )}
    >
      <button
        type="button"
        data-like-fab
        aria-label={`좋아요 ${likes}개`}
        aria-pressed={liked}
        onClick={guard(
          toggleLike,
          "like",
          "좋아요는 OSS 앱에서 로그인 후 누를 수 있어요.",
        )}
        className={cn(
          "flex h-12 min-w-12 items-center justify-center gap-1 rounded-full bg-[var(--bw-true-white)] shadow-[0_4px_12px_rgb(13_13_13/0.12)]",
          likes > 0 && "px-4",
          REACTION_PRESS_MOTION,
        )}
      >
        <span
          className={cn(
            "inline-flex",
            liked
              ? "text-reaction-bar-detail-active-like-icon"
              : "text-reaction-bar-detail-default-icon",
            pop && REACTION_POP_MOTION,
          )}
        >
          <HeartIcon size={20} filled={liked} />
        </span>
        {likes > 0 ? (
          <span
            className={cn(
              "text-body-s",
              liked
                ? "text-reaction-bar-detail-active-count-text"
                : "text-reaction-bar-detail-default-count-text",
            )}
          >
            {likes}
          </span>
        ) : null}
      </button>
    </div>
  );
}

/**
 * 스크롤 맨 끝 빈칸 60 — 떠 있는 좋아요 버튼(48 + 입력 바와 간격 12)이 마지막 글을 가리지 않게 비운다.
 * 외부 브라우저에선 버튼도 입력 바도 없으니(PostDetailFooter) 비우지 않는다.
 */
export function PostLikeFabSpacer() {
  const externalBrowser = useIsExternalBrowser();
  if (externalBrowser) {
    return null;
  }
  return <div aria-hidden className="h-15" />;
}
