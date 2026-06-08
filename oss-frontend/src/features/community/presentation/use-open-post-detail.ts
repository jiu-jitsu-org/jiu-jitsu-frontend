"use client";

import { useRouter } from "next/navigation";

import { isNativeBridgeAvailable, openNativeSubview } from "@/shared/lib/native-bridge";

/** 게시글 상세 웹 경로. */
function postDetailPath(postId: number): string {
  return `/community/${postId}`;
}

/**
 * 게시글 상세 열기 핸들러.
 *
 * 플랫폼 분기를 한 곳에 모은다(shared FeedCard는 onPress 콜백만 알고 브릿지는 모른다).
 * - 네이티브 웹뷰: OPEN_SUBVIEW로 네이티브가 풀스크린 웹뷰를 push → 헤더/탭바를 덮는다.
 *   (리스트 웹뷰는 별도 인스턴스로 보존 → 닫고 돌아와도 스크롤/상태 유지)
 * - 웹 단독: 같은 웹뷰 내 라우터 이동.
 */
export function useOpenPostDetail() {
  const router = useRouter();

  return (postId: number) => {
    const path = postDetailPath(postId);

    if (isNativeBridgeAvailable()) {
      // 동일 origin 절대경로로 전달 → 새 웹뷰가 세션 쿠키 공유.
      openNativeSubview(`${window.location.origin}${path}`);
      return;
    }

    router.push(path);
  };
}
