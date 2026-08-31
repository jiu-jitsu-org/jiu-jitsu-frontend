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
 * WHY 앱바를 감추는가: 상세 앱바는 뒤로가기를 네이티브가 담당하는 전제로 만들어져 브라우저에서는
 * 동작하지 않는 UI가 된다. 함께 사라지는 ⋮ 메뉴(신고 · 숨기기)와 알림 종도 모두 로그인이 필요해
 * 공유 링크로 들어온 비로그인 사용자에게 노출할 이유가 없다.
 */
export function PostDetailHeader({ appBar }: { appBar: ReactNode }) {
  const externalBrowser = useIsExternalBrowser();

  if (externalBrowser) {
    return <OpenInAppBanner />;
  }

  return <>{appBar}</>;
}
