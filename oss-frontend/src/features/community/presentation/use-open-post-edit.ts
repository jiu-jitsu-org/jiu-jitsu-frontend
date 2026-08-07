"use client";

import { useRouter } from "next/navigation";

import { isNativeBridgeAvailable, openNativeSubview } from "@/shared/lib/native-bridge";

/** 게시글 수정 화면 웹 경로. */
function postEditPath(postId: number): string {
  return `/community/${postId}/edit`;
}

/**
 * 게시글 수정 화면 열기 핸들러.
 *
 * 상세 열기(useOpenPostDetail)와 동일한 규칙 — 네이티브면 풀스크린 서브뷰로 push해 헤더/탭바를 덮고,
 * 웹 단독이면 같은 웹뷰에서 라우터 이동. 수정은 확인 알럿이 없으므로 브릿지 왕복도 필요 없다.
 *
 * FIXME(라우트): `/community/{id}/edit` 화면이 아직 없다. 수정 화면이 추가되기 전까지 이 경로는
 * 404로 떨어지므로, 호출부(⋮ 메뉴)에서 노출 여부를 함께 결정한다.
 */
export function useOpenPostEdit() {
  const router = useRouter();

  return (postId: number) => {
    const path = postEditPath(postId);

    if (isNativeBridgeAvailable()) {
      // 동일 origin 절대경로로 전달 → 새 웹뷰가 세션 쿠키 공유.
      openNativeSubview(`${window.location.origin}${path}`);
      return;
    }

    router.push(path);
  };
}
