"use client";

import { useState } from "react";

import { formatExactDateTime, formatRelativeTime } from "@/shared/lib/time";
import { useServerNow } from "@/shared/ui/server-clock";

/**
 * 게시글 상세의 작성 시각 (클라이언트 leaf) — 탭하면 정확 시각 ↔ 상대 시간 (시간 표시 정책 2, #188).
 *
 * 전환은 게시글 상세에만 있다. 리스트 · 댓글 · 대댓글은 상대 시간 고정이라 RelativeTime을 쓴다.
 * 상대 시간일 때는 ServerClock을 따라 60초마다 · 포그라운드 복귀 시 다시 계산된다.
 *
 * 글자(12) 그대로는 손가락으로 누르기 작아 위아래 4씩 터치 영역을 넓히고 음수 마진으로 줄 높이를 지킨다.
 */
export function PostDetailTime({ createdAt }: { createdAt: string }) {
  const [exact, setExact] = useState(false);
  const now = useServerNow();

  return (
    <button
      type="button"
      onClick={() => setExact((value) => !value)}
      aria-pressed={exact}
      className="-my-1 py-1"
    >
      <time dateTime={createdAt}>
        {exact
          ? formatExactDateTime(createdAt)
          : formatRelativeTime(createdAt, now)}
      </time>
    </button>
  );
}
