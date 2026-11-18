"use client";

import { useRouter } from "next/navigation";

import {
  isNativeBridgeAvailable,
  openNativeUserProfile,
} from "@/shared/lib/native-bridge";
import { useOpenInAppPrompt } from "@/shared/ui";

import { MY_ACTIVITY_PATH } from "@/features/community/presentation/my-activity-path";

/** 브라우저에서 남의 작성자를 눌렀을 때 안내(#518). */
const PROFILE_IN_APP_MESSAGE = "프로필은 OSS 앱에서 볼 수 있어요.";

/**
 * 작성자(사진·닉네임) 탭 핸들러(#271). 누를 곳이 없으면 undefined를 돌려줘 정적 표시로 두게 한다.
 *
 * 앱 웹뷰에서는 OPEN_USER_PROFILE을 보내 네이티브가 연다 — 남이면 그 회원 프로필, 나면 MY 탭.
 * 일반 브라우저에는 프로필 화면이 없어, 내 이름은 내 커뮤니티 활동(/community/me)으로 가고
 * 남의 이름은 "앱에서 계속하기" 안내를 띄운다(#518 — 눌러도 반응이 없으면 고장으로 읽힌다).
 * 남의 id를 모르면(응답에 없어 0) 누를 수 없다.
 */
export function useOpenAuthorProfile() {
  const router = useRouter();
  const { prompt } = useOpenInAppPrompt();

  return (userId: number, isOwner: boolean): (() => void) | undefined => {
    if (!isOwner && userId <= 0) return undefined;

    return () => {
      if (isNativeBridgeAvailable()) {
        openNativeUserProfile({ userId, isMe: isOwner });
        return;
      }
      if (isOwner) {
        router.push(MY_ACTIVITY_PATH);
        return;
      }
      prompt({ message: PROFILE_IN_APP_MESSAGE });
    };
  };
}
