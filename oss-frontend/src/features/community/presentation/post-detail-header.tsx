"use client";

import type { ReactNode } from "react";

import { OpenInAppBanner } from "@/features/community/presentation/open-in-app-banner";
import { useIsExternalBrowser } from "@/shared/lib/native-bridge";

/**
 * 상세 화면 헤더 스위치 — 앱 웹뷰면 앱바, 외부 브라우저면 '앱 열기' 배너(#72).
 *
 * 앱바는 서버 컴포넌트가 만든 엘리먼트를 그대로 받는다(props로 통과). 판별에만 클라이언트가
 * 필요하지, 앱바 자체를 클라이언트 트리로 끌어올 이유는 없기 때문이다.
 *
 * WHY 앱바를 감추는가: 앱바의 ⋮ 메뉴(신고 · 숨기기)와 알림 종은 모두 로그인이 필요한 액션이라
 * 공유 링크로 들어온 비로그인 사용자에게 노출할 이유가 없다. (뒤로가기는 웹이 그려 브라우저에서도
 * 동작하지만, 배너로 바꾸는 이유는 이 로그인 액션들이므로 그대로 둔다 — #144)
 */
export function PostDetailHeader({ appBar }: { appBar: ReactNode }) {
  const externalBrowser = useIsExternalBrowser();

  if (externalBrowser) {
    return <OpenInAppBanner />;
  }

  return <>{appBar}</>;
}
