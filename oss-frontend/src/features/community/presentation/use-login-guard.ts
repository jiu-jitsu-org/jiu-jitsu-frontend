"use client";

import { useCallback } from "react";

import {
  useAuth,
  useIsSignedIn,
} from "@/features/auth/presentation/auth-provider";
import { useIsDemoMode } from "@/features/community/presentation/community-demo-context";
import { useIsExternalBrowser } from "@/shared/lib/native-bridge";
import { useOpenInAppPrompt } from "@/shared/ui";

/**
 * 로그인이 필요한 행위를 탭 시점에 가로챈다 — 외부 브라우저는 앱 안내(#72), 앱 웹뷰 비로그인은
 * 로그인 알럿(#173).
 *
 * WHY 탭 시점인가(앱 웹뷰): "일단 실행 → 401 → 알럿"이면 좋아요·저장이 켜졌다 꺼지며 깜빡이고,
 * 댓글은 다 입력한 뒤 전송 시점에야 막힌다. 요청을 보내기 전에 막아 낙관적 토글·401 왕복을 없앤다.
 * 로그인 후 누르려던 행위는 자동 실행하지 않는다(promptLogin) — 좋아요·저장 API가 토글이라 이미 눌렀던
 * 글이 취소될 수 있고, 정책도 화면 복귀까지만 요구한다.
 *
 * WHY 외부 브라우저는 안내인가: 공유 링크로 들어온 사용자에게 좋아요·댓글·저장이 회색으로 죽어 있으면
 * 고장난 것으로 읽히고, 로그인 UI를 띄울 네이티브도 없다. 요청은 보내지 않는다(401 확정 왕복).
 *
 * 세션 판정 중(loading)에는 탭을 무시한다 — 비로그인으로 보면 로그인 사용자에게 알럿이 뜬다.
 * 예시(데모)는 네트워크 없이 UX만 보여주는 화면이라 가로채지 않는다.
 *
 * `message`는 외부 브라우저 안내 문구다. 완성된 문장으로 넘긴다(조사 처리를 피하기 위함).
 * `guest`는 앱 웹뷰 비로그인 여부 — 신고·알림처럼 진입점 자체를 감추는 곳이 쓴다.
 */
export function useLoginGuard(): {
  externalBrowser: boolean;
  guest: boolean;
  guard: (action: () => void, message: string) => () => void;
} {
  const externalBrowser = useIsExternalBrowser();
  const openInApp = useOpenInAppPrompt();
  const demo = useIsDemoMode();
  const { status, promptLogin } = useAuth();
  const signedIn = useIsSignedIn();

  const guard = useCallback(
    (action: () => void, message: string) => () => {
      if (externalBrowser) {
        openInApp.prompt({ message });
        return;
      }
      if (demo) {
        action();
        return;
      }
      if (status === "loading") return;
      if (status === "anonymous") {
        promptLogin();
        return;
      }
      action();
    },
    [demo, externalBrowser, openInApp, promptLogin, status],
  );

  return {
    externalBrowser,
    guest: !externalBrowser && !demo && !signedIn,
    guard,
  };
}
