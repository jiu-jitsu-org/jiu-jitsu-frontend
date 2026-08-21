"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useIsDemoMode } from "@/features/community/presentation/community-demo-context";
import { useCommentReply } from "@/features/community/presentation/comment-reply-context";
import { bffFetch } from "@/shared/lib/http/bff-fetch";
import { cn } from "@/shared/lib/cn";
import { useViewportRect } from "@/features/community/presentation/use-viewport-rect";
import { CloseIcon, ReplyBranchIcon, SendIcon } from "@/shared/ui/icons";
import { OutboundMessageType, postToNative } from "@/shared/lib/native-bridge";

/** 액션바의 "댓글쓰기"가 포커스 대상으로 참조하는 입력 id(단일 출처). */
export const COMMENT_INPUT_ELEMENT_ID = "community-comment-input";

/**
 * 하단 댓글 입력 바 (클라이언트 leaf).
 *
 * 제출 시 BFF로 POST한 뒤 router.refresh()로 서버 렌더 댓글 목록을 다시 가져온다
 * (클라이언트에 목록 상태를 중복으로 들지 않음). 401이면 네이티브 로그인 유도.
 *
 * 답글 모드: 댓글의 답글 버튼이 대상을 지정하면 입력창 위에 "○○님에게 답글" 칩이 뜨고,
 * 전송 시 parentId가 함께 나간다. 인라인 입력창을 따로 두지 않고 이 바를 재사용한다.
 */
export function CommentInputBar({ postId }: { postId: number }) {
  const router = useRouter();
  const demo = useIsDemoMode();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { target, cancelReply, completeReply } = useCommentReply();
  // 키보드가 떠 있는 동안엔 홈 인디케이터(safe-area)가 키보드에 가려 의미가 없으므로 하단 패딩 0.
  const rect = useViewportRect();

  // 입력에 따라 높이 자동 확장. 최대 5줄(max-h-[129px])은 CSS가 제한하고 초과분은 스크롤.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  // 답글 대상이 새로 지정되면 입력창으로 포커스를 옮긴다(버튼 쪽에서도 한 번 시도하지만,
  // 대상이 바뀌기만 한 경우까지 커버하려면 여기서도 반응해야 한다).
  useEffect(() => {
    if (!target) return;
    textareaRef.current?.focus();
  }, [target]);

  const canSubmit = value.trim().length > 0 && !submitting;

  async function submit() {
    const content = value.trim();
    if (!content || submitting) return;

    // 예시(데모)에선 네트워크 없이 입력만 비운다(목록 갱신/전송 없음).
    if (demo) {
      setValue("");
      cancelReply();
      return;
    }

    // 대상은 전송 시점 값으로 고정한다 — 응답을 기다리는 동안 대상이 바뀌어도 영향받지 않게.
    const parentId = target?.parentId;

    setSubmitting(true);
    try {
      const response = await bffFetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parentId ? { content, parentId } : { content }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          postToNative({ type: OutboundMessageType.AUTH_LOGIN_PROMPT });
        }
        return;
      }

      setValue("");
      // 답글이면 해당 묶음을 펼쳐 방금 쓴 답글이 보이게 한다(접혀 있으면 안 보임).
      if (parentId) {
        completeReply(parentId);
      } else {
        cancelReply();
      }
      // 서버 렌더 목록 재요청 — 새 댓글이 정렬 규칙에 맞게 반영된다.
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    // 배경 comment-input-bar/container-bg. 평소엔 safe-area bottom(노치)도 같은 배경으로 칠하지만,
    // 키보드가 떠 있는 동안엔 그 영역이 키보드에 가려 의미가 없으므로 패딩을 0으로 줘 키보드에 딱 붙인다.
    <div
      className={cn(
        // toast-inset-comment-bar: 이 바가 떠 있는 화면에서는 토스트를 바 위로 올린다(globals.css).
        // 토스트는 body 직속 fixed라 부모 레이아웃으로는 위치를 못 알려줘, html:has()로 신호를 준다.
        "toast-inset-comment-bar bg-comment-input-bar-container-bg",
        rect?.keyboardOpen ? "pb-0" : "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      {/* 답장 대상 행 — 답글 모드일 때만. 높이 44 고정, 수직 가운데, 좌우 16.
          분기 아이콘 24 바로 옆(간격 0)에 텍스트, 우측 끝에 × 버튼(40x40, 아이콘 24).
          좌우 16은 × "버튼 영역" 기준이라 음수 마진으로 당기지 않는다. */}
      {target ? (
        <div className="flex h-11 items-center px-4">
          {/* 대댓글 목록의 분기 아이콘과 동일 에셋(24, strokeWidth 2) — 색만 다르다. */}
          <ReplyBranchIcon
            size={24}
            className="shrink-0 text-comment-input-bar-reply-ref-thread-icon"
          />
          <span className="min-w-0 flex-1 truncate text-sm leading-[21px] text-comment-input-bar-reply-ref-text">
            {target.nickname}님에게 답장
          </span>
          <button
            type="button"
            onClick={cancelReply}
            aria-label="답장 취소"
            // 버튼 영역 40x40(size-10) = 아이콘 24 + 사방 여백 8. 우측 16은 이 버튼 바깥 기준.
            className="inline-flex size-10 shrink-0 items-center justify-center text-comment-input-bar-reply-ref-close-icon"
          >
            <CloseIcon size={24} />
          </button>
        </div>
      ) : null}

      {/* 바는 내용에 따라 높이 가변(min-h 69), 전송 버튼은 하단 고정(items-end). 좌우 16(px-4).
          상단 12 고정. 하단은 키보드가 내려가 있을 때만 16(12+4) — 키보드에 붙어 있을 땐 12로 좁힌다.
          transition을 두지 않아 키보드 전환 시 애니메이션 없이 바로 바뀐다. */}
      <div
        className={cn(
          "flex min-h-[69px] items-end px-4 pt-3",
          rect?.keyboardOpen ? "pb-3" : "pb-4",
        )}
      >
        {/* 텍스트 영역: 좌우 16(px-4)/상하 12(py-3), 멀티라인 — 엔터=줄바꿈, 최대 5줄(max-h-[129px]) 후 스크롤.
            radius 24. 색은 comment-input-bar 토큰(배경/입력/플레이스홀더). */}
        <textarea
          id={COMMENT_INPUT_ELEMENT_ID}
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="댓글을 입력해주세요."
          className="max-h-[129px] flex-1 resize-none overflow-y-auto rounded-[24px] bg-comment-input-bar-bg px-4 py-3 text-sm leading-[21px] text-comment-input-bar-text outline-none placeholder:text-comment-input-bar-placeholder"
        />
      <button
        type="button"
        onClick={() => void submit()}
        disabled={!canSubmit}
        aria-label="댓글 등록"
        // 버튼 40x40(size-10) = 종이비행기 아이콘 24 + 상하좌우 여백 8(가운데 정렬). 우측 고정.
        // 입력 1자 이상: send-icon-active, 빈 상태(플레이스홀더): send-icon-disabled.
        className={cn(
          "inline-flex size-10 shrink-0 items-center justify-center rounded-full",
          canSubmit
            ? "text-comment-input-bar-send-icon-active"
            : "text-comment-input-bar-send-icon-disabled",
        )}
      >
        <SendIcon size={24} />
      </button>
      </div>
    </div>
  );
}
