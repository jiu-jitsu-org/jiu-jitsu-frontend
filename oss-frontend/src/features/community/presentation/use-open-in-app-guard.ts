"use client";

import { useCallback } from "react";

import { useIsExternalBrowser } from "@/shared/lib/native-bridge";
import { useOpenInAppPrompt } from "@/shared/ui";

/**
 * 로그인이 필요한 행위를 외부 브라우저(비로그인)에서는 "앱에서 계속하기" 안내로 돌린다(#72).
 *
 * WHY 표시 전용(비활성)이 아니라 안내인가: 공유 링크로 들어온 사용자에게 좋아요·댓글·저장이
 * 회색으로 죽어 있으면 고장난 것으로 읽히고, 무엇을 해야 참여할 수 있는지도 알 수 없다.
 * 요청은 보내지 않는다 — 세션이 없어 401이 확정된 왕복이고, 그 401 처리(네이티브 로그인 유도)도
 * 브라우저에서는 아무 일도 하지 않는다.
 *
 * 앱 웹뷰에서는 행위를 그대로 돌려준다 — 그쪽 로그인 유도는 기존 401 → AUTH_LOGIN_PROMPT 경로가 맡는다.
 *
 * 액션바·댓글 좋아요·답글이 함께 쓴다. `message`는 완성된 문장으로 넘긴다(조사 처리를 피하기 위함).
 */
export function useOpenInAppGuard(): {
  externalBrowser: boolean;
  guard: (action: () => void, message: string) => () => void;
} {
  const externalBrowser = useIsExternalBrowser();
  const openInApp = useOpenInAppPrompt();

  const guard = useCallback(
    (action: () => void, message: string) =>
      externalBrowser ? () => openInApp.prompt({ message }) : action,
    [externalBrowser, openInApp],
  );

  return { externalBrowser, guard };
}
