"use client";

import { useRouter } from "next/navigation";

import { useAuth } from "@/features/auth/presentation/auth-provider";
import {
  isNativeBridgeAvailable,
  openNativeSubview,
} from "@/shared/lib/native-bridge";

/** 게시글 작성 웹 경로. */
const POST_WRITE_PATH = "/community/write";

/**
 * 게시글 작성 열기 핸들러.
 *
 * 상세(useOpenPostDetail)와 동일 철학 — 플랫폼 분기를 한 곳에 모은다.
 * - 네이티브 웹뷰: OPEN_SUBVIEW로 작성 화면을 풀스크린 웹뷰로 push(헤더/탭바를 덮음).
 *   동일 origin 절대경로로 전달 → 새 웹뷰가 세션 쿠키 공유.
 * - 웹 단독: 같은 웹뷰 내 라우터 이동.
 *
 * 진입은 로그인 상태에서만 허용한다(requireAuth). 비로그인이면 화면을 이동하지 않고
 * 네이티브에 AUTH_LOGIN_PROMPT('로그인 요청' 안내 알럿)만 띄운다. 로그인 성공 시
 * 보관된 열기 행위가 자동 복귀돼 작성 화면으로 진입한다.
 *
 * 닫기(등록/취소)는 작성 화면의 closeScreen이 CLOSE_SUBVIEW로 pop해 짝을 맞춘다.
 */
export function useOpenPostWrite() {
  const router = useRouter();
  const { requireAuth } = useAuth();

  return () => {
    requireAuth(
      () => {
        if (isNativeBridgeAvailable()) {
          openNativeSubview(`${window.location.origin}${POST_WRITE_PATH}`);
          return;
        }

        router.push(POST_WRITE_PATH);
      },
      { reason: "게시글 작성" },
    );
  };
}
