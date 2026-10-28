"use client";

import { useRouter } from "next/navigation";

import {
  isNativeBridgeAvailable,
  openNativeMyProfile,
} from "@/shared/lib/native-bridge";

import { MY_ACTIVITY_PATH } from "@/features/community/presentation/use-open-my-activity";

/**
 * 내 프로필 열기 핸들러(#273).
 *
 * 커뮤니티 어느 화면에서든 "내 사진(아바타)"을 눌렀을 때 사용한다.
 *
 * - 네이티브 웹뷰: OPEN_MY_PROFILE 메시지를 보내 앱 MY 탭으로 이동한다.
 *   현재 웹뷰를 닫지 않고 네이티브가 MY 탭을 여는 방식이다.
 * - 웹 단독: 내 커뮤니티 활동(/community/me)으로 이동한다(브라우저 폴백).
 *
 * WHY 새 훅을 만들었는가: useOpenMyActivity는 내 활동 웹뷰(OPEN_SUBVIEW)를 열지만,
 * 내 사진 탭은 "MY 탭이라는 네이티브 화면"으로 이동해야 한다. 대상이 달라 따로 분리한다.
 */
export function useOpenMyProfile() {
  const router = useRouter();

  return () => {
    if (isNativeBridgeAvailable()) {
      openNativeMyProfile();
      return;
    }

    // 브라우저 폴백: 커뮤니티 활동 페이지(= 웹에서의 내 프로필에 가장 가까운 화면).
    router.push(MY_ACTIVITY_PATH);
  };
}
