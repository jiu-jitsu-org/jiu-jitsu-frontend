"use client";

import { useState } from "react";

import { REACTION_PRESS_MOTION } from "@/features/community/presentation/comment-reaction-styles";
import { useOpenPostWrite } from "@/features/community/presentation/use-open-post-write";
import { cn } from "@/shared/lib/cn";
import { EditIcon } from "@/shared/ui/icons";

/**
 * 게시글 작성 진입 FAB (우측 하단 고정, 여백 12px).
 *
 * 네이티브 웹뷰에선 OPEN_SUBVIEW로 작성 화면을 풀스크린 서브뷰로 띄우고(useOpenPostWrite),
 * 웹 단독에선 라우터 이동한다. 작성 화면 닫기는 CLOSE_SUBVIEW로 pop된다.
 * 브릿지 분기를 위해 클라이언트 컴포넌트로 둔다(서버 페이지에 끼워 넣는 작은 island).
 */
export function PostWriteFab() {
  const openWrite = useOpenPostWrite();
  // 누를 때마다 1씩 — 연필 key로 써서 흔들림을 처음부터 다시 재생한다.
  const [taps, setTaps] = useState(0);

  return (
    <button
      type="button"
      onClick={() => {
        setTaps((n) => n + 1);
        openWrite();
      }}
      aria-label="게시글 작성"
      // 반응 버튼과 같은 눌림·튐 + 놓을 때 연필이 좌우로 한 번 흔들린다.
      className={cn(
        "fixed bottom-3 right-3 flex h-12 w-12 items-center justify-center rounded-full bg-button-filled-default-bg text-button-filled-default-text",
        REACTION_PRESS_MOTION,
      )}
    >
      <span
        key={taps}
        className={cn(
          "inline-flex",
          taps > 0 && "motion-safe:animate-pen-wiggle",
        )}
      >
        <EditIcon size={20} />
      </span>
    </button>
  );
}
