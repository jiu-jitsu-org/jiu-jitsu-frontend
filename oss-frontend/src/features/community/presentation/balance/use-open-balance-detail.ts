"use client";

import { useRouter } from "next/navigation";

import {
  isNativeBridgeAvailable,
  openNativeSubview,
} from "@/shared/lib/native-bridge";

/** 밸런스 게임 상세 웹 경로. */
function balanceDetailPath(contentId: number): string {
  return `/community/balance/${contentId}`;
}

/**
 * 밸런스 게임 상세 열기 핸들러.
 *
 * 게시글 상세(useOpenPostDetail)와 같은 철학 — 플랫폼 분기를 한 곳에 모은다.
 * - 네이티브 웹뷰: OPEN_SUBVIEW로 풀스크린 웹뷰를 push (리스트 웹뷰는 살아 있어 스크롤 유지)
 * - 웹 단독: 같은 웹뷰 내 라우터 이동
 *
 * 로그인 게이트는 없다 — 비로그인도 게시글처럼 상세에 들어가 열람한다(#173). 로그인이 필요한
 * 행위(투표 · 좋아요 · 댓글)는 상세 안에서 탭 시점에 막는다.
 *
 * 게시글과 다른 점: 복귀 시 갱신 표시(markPostDirty)를 남기지 않는다. 게시글 목록은 어떤 카드가 바뀌었는지
 *    알아야 해서 대상을 기록하지만, 밸런스 게임은 화면에 하나뿐이라 고를 것이 없다.
 *    BalanceGameSection이 visibilitychange로 복귀를 감지해 무조건 다시 읽는다 —
 *    상세에서 투표하고 돌아와도 그 경로로 반영된다.
 */
export function useOpenBalanceDetail() {
  const router = useRouter();

  return (contentId: number) => {
    const path = balanceDetailPath(contentId);

    if (isNativeBridgeAvailable()) {
      // 동일 origin 절대경로로 전달 → 새 웹뷰가 세션 쿠키를 공유한다.
      openNativeSubview(`${window.location.origin}${path}`);
      return;
    }

    router.push(path);
  };
}
