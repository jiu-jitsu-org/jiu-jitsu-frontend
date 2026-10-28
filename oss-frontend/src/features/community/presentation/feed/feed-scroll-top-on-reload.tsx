"use client";

import { useEffect } from "react";

/**
 * 새로고침하면 홈을 맨 위(오늘의 밸런스 게임)부터 보여준다(#260).
 *
 * WHY: 브라우저는 새로고침 때 이전 스크롤 위치를 되살린다(history.scrollRestoration 기본값 auto).
 * 그런데 그 순간 화면은 loading.tsx 스켈레톤이라 실제 피드보다 짧고, 피드가 스트리밍으로 들어와
 * 길어지는 사이에 되살리기를 다시 시도하면서 원래와 다른 엉뚱한 위치에 멈춘다(실측: 1500 → 1290).
 * 새로 받은 피드는 순서·높이가 이전과 같다는 보장도 없어 "같은 자리"로 돌려놓는 것 자체가 의미가 없다.
 *
 * WHY 떠날 때(pagehide) manual을 거는가: 크롬은 새로고침을 **시작하는 순간**의 기록 값을 보고 되살릴지
 * 정한다. 새 문서가 뜬 뒤에 manual로 바꾸면 load 전이어도 무시된다(배포 빌드 실측 — 개발 서버에서는
 * 우연히 통과해 보였다). 그래서 문서가 내려가는 순간 홈 기록에 manual을 남겨 둔다.
 *
 * WHY 다시 auto로 되돌리는가: 웹에서 상세 → 뒤로 가기는 같은 문서 안의 이동이라 브라우저가 위치를 정확히
 * 되살린다 — 그 동작은 살려 둔다. 새 기록 칸은 지금 값을 물려받으므로, manual로 둔 채 상세로 가면
 * 뒤로 왔을 때 위치가 사라진다. 다른 사이트에 갔다가 문서째 돌아온 경우도 새로고침처럼 맨 위에서 시작한다.
 */
export function FeedScrollTopOnReload() {
  useEffect(() => {
    const markManual = () => {
      history.scrollRestoration = "manual";
    };
    // bfcache 복귀는 문서가 그대로 살아 돌아오므로(위치도 그대로) 걸어 둔 manual만 푼다.
    const unmarkOnRestore = (event: PageTransitionEvent) => {
      if (event.persisted) history.scrollRestoration = "auto";
    };
    window.addEventListener("pagehide", markManual);
    window.addEventListener("pageshow", unmarkOnRestore);
    return () => {
      window.removeEventListener("pagehide", markManual);
      window.removeEventListener("pageshow", unmarkOnRestore);
    };
  }, []);

  useEffect(() => {
    if (history.scrollRestoration !== "manual") return;

    // 되살리기 기회가 지나간 뒤 auto로 되돌린다.
    // load 전이면 load 뒤로, 이미 지났으면 두 프레임 뒤로 미룬다(되살리기가 도는 프레임을 넘긴다).
    let frame = 0;
    const setAuto = () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("load", restoreAuto);
      history.scrollRestoration = "auto";
    };
    function restoreAuto() {
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(setAuto);
      });
    }
    if (document.readyState === "complete") restoreAuto();
    else window.addEventListener("load", restoreAuto, { once: true });

    // 되돌리기 전에 홈을 떠나면(로드 전에 글을 여는 경우) 바로 되돌린다.
    return () => {
      if (history.scrollRestoration === "manual") setAuto();
    };
  }, []);

  return null;
}
