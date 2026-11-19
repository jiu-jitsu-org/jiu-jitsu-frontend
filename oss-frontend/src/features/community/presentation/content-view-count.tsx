"use client";

import { useEffect, useRef, useState } from "react";

import { bffFetch } from "@/shared/lib/http/bff-fetch";

/**
 * 글 · 밸런스 게임 상세의 "조회 n" (클라이언트 leaf, #523).
 *
 * 상세 조회는 조회수를 올리지 않는다. 화면을 맞추려고 같은 방문 안에서 다시 읽기 때문이다 — 피드 복귀 카드 갱신,
 * 댓글 등록 · 삭제 · 정렬 뒤 router.refresh, 당겨서 새로고침, 로그인 직후, 마감 전환 등. 링크 미리보기 수집기도 상세를 읽는다.
 * 그래서 상세가 처음 그려질 때 '봤음'(viewPath, POST)을 한 번만 부르고 센 값으로 바꾼다(대회 상세 #420과 같은 방식).
 * 다시 그리기는 같은 컴포넌트가 남아 있어 다시 세지 않고, 닫고 다시 열면 새로 그려져 한 번 더 센다.
 *
 * 다시 그리며 받은 숫자(initialViews)가 센 값보다 크면(그사이 남이 봄) 큰 쪽을 보여 준다.
 * 실패하면 처음 받은 숫자를 그대로 둔다 — 그 방문은 세지 않는다.
 */
export function ContentViewCount({
  viewPath,
  initialViews,
}: {
  /** '봤음' BFF 경로 — 예: /api/community/posts/{id}/views */
  viewPath: string;
  initialViews: number;
}) {
  const [counted, setCounted] = useState<number | null>(null);
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void bffFetch(viewPath, { method: "POST" })
      .then(async (response) => {
        if (!response.ok) return;
        const body = (await response.json()) as {
          data?: { viewCount?: number };
        } | null;
        const next = body?.data?.viewCount;
        if (typeof next === "number") setCounted(next);
      })
      .catch(() => undefined);
  }, [viewPath]);

  const views = Math.max(initialViews, counted ?? 0);
  return <span>조회 {views}</span>;
}
