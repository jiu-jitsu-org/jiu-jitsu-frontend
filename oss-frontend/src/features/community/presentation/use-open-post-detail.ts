"use client";

import { useRouter } from "next/navigation";

import { markPostDirty } from "@/features/community/presentation/dirty-posts";
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
 *
 * 여는 시점에 이 글을 갱신 대상으로 기록한다 — 상세에서 좋아요·저장·댓글·수정·삭제 중 무엇이
 * 일어날지 모르므로, 목록은 "값이 바뀌었을 수 있다"만 알고 복귀 시 서버 최신값을 다시 읽는다(#73).
 */
export function useOpenPostDetail() {
  const router = useRouter();

  return (postId: number) => {
    const path = postDetailPath(postId);
    markPostDirty(postId);

    if (isNativeBridgeAvailable()) {
      // 동일 origin 절대경로로 전달 → 새 웹뷰가 세션 쿠키 공유.
      openNativeSubview(`${window.location.origin}${path}`);
      return;
    }

    router.push(path);
  };
}
