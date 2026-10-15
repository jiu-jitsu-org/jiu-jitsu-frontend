"use client";

import { formatRelativeTime } from "@/shared/lib/time";
import { useServerNow } from "@/shared/ui/server-clock";

/**
 * 공통 상대 시간 라벨 — `<time>` 하나만 그리는 말단 컴포넌트.
 *
 * 서버 시각 기준 시계(ServerClockProvider)를 읽어 60초마다 · 포그라운드 복귀 시 다시 그려진다.
 * 리스트 · 댓글 · 대댓글은 상대 시간 고정이라 이 컴포넌트를 그대로 쓴다(정확 시각 전환은 상세 한정).
 */
export function RelativeTime({
  iso,
  className,
}: {
  /** 오프셋이 명시된 ISO 문자열(infrastructure가 toKstIso로 정규화한 값). */
  iso: string;
  className?: string;
}) {
  const now = useServerNow();

  return (
    <time dateTime={iso} className={className}>
      {formatRelativeTime(iso, now)}
    </time>
  );
}
