"use client";

import { useRouter } from "next/navigation";

import {
  isNativeBridgeAvailable,
  openNativeUserProfile,
} from "@/shared/lib/native-bridge";

import { MY_ACTIVITY_PATH } from "@/features/community/presentation/my-activity-path";

/**
 * 작성자(사진·닉네임) 탭 핸들러(#271). 누를 곳이 없으면 undefined를 돌려줘 정적 표시로 두게 한다.
 *
 * 앱 웹뷰에서는 OPEN_USER_PROFILE을 보내 네이티브가 연다 — 남이면 그 회원 프로필, 나면 MY 탭.
 * 일반 브라우저에는 프로필 화면이 없어, 내 이름은 내 커뮤니티 활동(/community/me)으로 가고
 * 남의 이름은 아무 일도 하지 않는다. 남의 id를 모르면(응답에 없어 0) 누를 수 없다.
 */
export function useOpenAuthorProfile() {
  const router = useRouter();

  return (userId: number, isOwner: boolean): (() => void) | undefined => {
    if (!isOwner && userId <= 0) return undefined;

    return () => {
      if (isNativeBridgeAvailable()) {
        openNativeUserProfile({ userId, isMe: isOwner });
        return;
      }
      if (isOwner) router.push(MY_ACTIVITY_PATH);
    };
  };
}
