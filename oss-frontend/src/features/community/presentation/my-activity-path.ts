"use client";

import { useRouter } from "next/navigation";

import {
  isNativeBridgeAvailable,
  openNativeSubview,
} from "@/shared/lib/native-bridge";

/** 내 커뮤니티 활동 웹 경로. 탭은 ?tab=posts(기본) | saved 로 고른다. */
export const MY_ACTIVITY_PATH = "/community/me";

/**
 * 내 커뮤니티 활동 열기 핸들러.
 *
 * 상세(useOpenPostDetail)와 같은 플랫폼 분기다.
 * - 네이티브 웹뷰: OPEN_SUBVIEW로 풀스크린 웹뷰를 push. 동일 origin 절대경로로 넘겨 세션 쿠키를 공유한다.
 * - 웹 단독: 같은 웹뷰 내 라우터 이동.
 *
 * 지금은 "내" 이름(아바타·닉네임)을 눌렀을 때만 쓴다. 다른 사람의 프로필·글 목록 API가 아직 없어
 * 남의 이름은 누를 수 없다 — API가 생기면 대상 id를 받는 형태로 넓힌다.
 */
export function useOpenMyActivity() {
  const router = useRouter();

  return () => {
    if (isNativeBridgeAvailable()) {
      openNativeSubview(`${window.location.origin}${MY_ACTIVITY_PATH}`);
      return;
    }

    router.push(MY_ACTIVITY_PATH);
  };
}
