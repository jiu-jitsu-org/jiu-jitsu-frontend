"use client";

import { useRouter } from "next/navigation";

import { useAuth } from "@/features/auth/presentation/auth-provider";
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
 * 게시글과 다른 점이 둘 있다.
 *
 * 1) 로그인 게이트가 있다. 비로그인은 상세로 가지 않고 로그인 유도만 띄우되, 로그인에 성공하면
 *    보관된 이동이 자동으로 이어진다(기획: "로그인 완료 후 상세로 이동"). 작성 FAB
 *    (use-open-post-write)과 같은 동작이다.
 *
 *    같은 카드의 투표(use-balance-vote)는 반대로 자동 복귀를 막는다 — 그쪽 정책은 "로그인 후
 *    다시 눌러야 함"이다. 이동은 되돌릴 수 있지만 투표는 한 번 들어가면 되돌리기 어려워,
 *    사용자가 의도를 다시 확인하게 하는 편이 안전하다.
 *
 * 2) 복귀 시 갱신 표시(markPostDirty)를 남기지 않는다. 게시글 목록은 어떤 카드가 바뀌었는지
 *    알아야 해서 대상을 기록하지만, 밸런스 게임은 화면에 하나뿐이라 고를 것이 없다.
 *    BalanceGameSection이 visibilitychange로 복귀를 감지해 무조건 다시 읽는다 —
 *    상세에서 투표하고 돌아와도 그 경로로 반영된다.
 */
export function useOpenBalanceDetail() {
  const router = useRouter();
  const { status, requireAuth } = useAuth();

  return (contentId: number) => {
    // 세션 판정 전에는 판단하지 않는다. loading 상태로 requireAuth를 부르면 로그인한
    // 사용자에게도 로그인 유도가 뜬다(requireAuth는 authenticated가 아니면 유도한다).
    if (status === "loading") return;

    requireAuth(
      () => {
        const path = balanceDetailPath(contentId);

        if (isNativeBridgeAvailable()) {
          // 동일 origin 절대경로로 전달 → 새 웹뷰가 세션 쿠키를 공유한다.
          openNativeSubview(`${window.location.origin}${path}`);
          return;
        }

        router.push(path);
      },
      { reason: "밸런스 게임 상세" },
    );
  };
}
