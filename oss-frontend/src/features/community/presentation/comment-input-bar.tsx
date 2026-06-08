"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { cn } from "@/shared/lib/cn";
import { CommentIcon } from "@/shared/ui/icons";
import { OutboundMessageType, postToNative } from "@/shared/lib/native-bridge";

/** 액션바의 "댓글쓰기"가 포커스 대상으로 참조하는 입력 id(단일 출처). */
export const COMMENT_INPUT_ELEMENT_ID = "community-comment-input";

/**
 * 하단 댓글 입력 바 (클라이언트 leaf).
 *
 * 제출 시 BFF로 POST한 뒤 router.refresh()로 서버 렌더 댓글 목록을 다시 가져온다
 * (클라이언트에 목록 상태를 중복으로 들지 않음). 401이면 네이티브 로그인 유도.
 */
export function CommentInputBar({ postId }: { postId: number }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = value.trim().length > 0 && !submitting;

  async function submit() {
    const content = value.trim();
    if (!content || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          postToNative({ type: OutboundMessageType.AUTH_LOGIN_PROMPT });
        }
        return;
      }

      setValue("");
      // 서버 렌더 목록 재요청 — 새 댓글이 정렬 규칙에 맞게 반영된다.
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    // 배경 navibar/container/background. safe-area bottom(노치)도 같은 배경으로 칠하기 위해
    // 바깥 컨테이너가 bg + pb(safe-area)를 갖고, 콘텐츠 행은 safe-area 제외 높이 69 고정 + 수직 가운데.
    <div className="bg-navibar-container-background pb-[env(safe-area-inset-bottom)]">
      {/* 텍스트필드↔버튼 여백 없음(gap 0). 버튼은 우측 고정. */}
      <div className="flex h-[69px] items-center px-4">
        <input
        id={COMMENT_INPUT_ELEMENT_ID}
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.nativeEvent.isComposing) {
            event.preventDefault();
            void submit();
          }
        }}
        placeholder="댓글을 입력해주세요."
        // 높이 41 고정 / 좌 16(pl-4) / 상하 12(py-3) / radius 24 / 배경 #EDEDED.
        // 입력 텍스트 #000000(Body S), 플레이스홀더 #9EA1A5(Body S — input의 text-sm 상속).
        className="h-[41px] flex-1 rounded-[24px] bg-[#EDEDED] py-3 pl-4 text-sm leading-[21px] text-[#000000] outline-none placeholder:text-[#9EA1A5]"
      />
      <button
        type="button"
        onClick={() => void submit()}
        disabled={!canSubmit}
        aria-label="댓글 등록"
        // 버튼 40x40(size-10) = 아이콘 24 + 상하좌우 여백 8(items/justify-center로 가운데 → 8 여백). 우측 고정.
        // 입력 1자 이상: button/filled/default-bg, 빈 상태(플레이스홀더): #D3D3D3.
        className={cn(
          "inline-flex size-10 shrink-0 items-center justify-center rounded-full",
          canSubmit ? "text-button-filled-default-bg" : "text-[#D3D3D3]",
        )}
      >
        <CommentIcon size={24} filled />
      </button>
      </div>
    </div>
  );
}
