"use client";

import type { ReactNode } from "react";

import { useIsExternalBrowser } from "@/shared/lib/native-bridge";

/**
 * 상세 화면 푸터 스위치 — 외부 브라우저면 댓글 입력 바를 감춘다(#72).
 *
 * 세션이 없어 전송이 반드시 401로 끝나는데, 그 401 처리는 네이티브 로그인 유도(AUTH_LOGIN_PROMPT)라
 * 브라우저에서는 아무 일도 일어나지 않는다. 입력은 되는데 보내지지 않는 입력창을 두는 것보다
 * 없는 편이 정직하다.
 *
 * 빈 자리에 '앱에서 댓글 남기기' 같은 하단 CTA는 두지 않기로 했다 — 참여 진입점은 상단 배너 하나로
 * 일원화한다(위아래 배너가 겹치면 과하다는 판단).
 */
export function PostDetailFooter({ inputBar }: { inputBar: ReactNode }) {
  const externalBrowser = useIsExternalBrowser();

  if (externalBrowser) {
    return null;
  }

  return <>{inputBar}</>;
}
