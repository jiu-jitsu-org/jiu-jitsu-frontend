"use client";

import { useRouter } from "next/navigation";

import { markPostDirty } from "@/features/community/presentation/dirty-posts";
import { POST_EDIT_FROM_DETAIL } from "@/features/community/presentation/post-edit-return";
import { isNativeBridgeAvailable, openNativeSubview } from "@/shared/lib/native-bridge";

/** 게시글 수정 화면 웹 경로. */
function postEditPath(postId: number, from?: typeof POST_EDIT_FROM_DETAIL): string {
  const path = `/community/${postId}/edit`;
  return from ? `${path}?from=${from}` : path;
}

/**
 * 게시글 수정 화면 열기 핸들러.
 *
 * 상세 열기(useOpenPostDetail)와 동일한 규칙 — 네이티브면 풀스크린 서브뷰로 push해 헤더/탭바를 덮고,
 * 웹 단독이면 같은 웹뷰에서 라우터 이동. 수정은 확인 알럿이 없으므로 브릿지 왕복도 필요 없다.
 *
 * 여는 시점에 갱신 대상으로 기록한다 — 기록은 웹뷰 단위(sessionStorage)라 앱에서는 수정 화면이
 * 아니라 목록 웹뷰에서 남겨야 목록이 복귀 시 이 글을 다시 읽는다.
 */
export function useOpenPostEdit(from?: typeof POST_EDIT_FROM_DETAIL) {
  const router = useRouter();

  return (postId: number) => {
    const path = postEditPath(postId, from);
    markPostDirty(postId);

    if (isNativeBridgeAvailable()) {
      // 동일 origin 절대경로로 전달 → 새 웹뷰가 세션 쿠키 공유.
      openNativeSubview(`${window.location.origin}${path}`);
      return;
    }

    router.push(path);
  };
}
