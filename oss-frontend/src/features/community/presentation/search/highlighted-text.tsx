import { useMemo, type ReactNode } from "react";

import { findSearchMatches } from "@/features/community/domain/post-search";

/**
 * 글 속 찾은 말 표시(#591) — 검색 단어가 든 자리만 파란 글자(primary)로 칠한다.
 *
 * 띄어쓰기가 달라도 찾는다('오픈매트'로 찾으면 '오픈 매트'가 한 덩어리로 칠해진다 — post-search).
 * 면을 깔지 않고 글자색만 바꾼다 — 카드에 색 면이 하나 더 생기지 않게. 굵기도 그대로라 줄바꿈 위치가 바뀌지 않는다.
 * 단어가 없으면(검색이 아닌 목록) 글을 그대로 돌려준다.
 */
export function HighlightedText({
  text,
  words,
}: {
  text: string;
  words?: readonly string[];
}) {
  const matches = useMemo(
    () => (words && words.length > 0 ? findSearchMatches(text, words) : []),
    [text, words],
  );
  if (matches.length === 0) return text;

  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const { start, end } of matches) {
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(
      <mark key={start} className="bg-transparent text-primary">
        {text.slice(start, end)}
      </mark>,
    );
    cursor = end;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}
