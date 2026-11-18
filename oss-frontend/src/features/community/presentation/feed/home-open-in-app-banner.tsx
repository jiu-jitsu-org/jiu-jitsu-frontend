"use client";

import { OpenInAppBanner } from "@/features/community/presentation/open-in-app-banner";
import { useIsExternalBrowser } from "@/shared/lib/native-bridge";

/**
 * 홈 맨 위 '앱 열기' 배너 — 외부 브라우저에서만 (#518).
 *
 * 앱 웹뷰의 홈은 앱이 머리를 그리므로 아무것도 그리지 않는다. 브라우저는 공유 링크로 들어온 첫 화면이라
 * 글 상세(PostDetailHeader)처럼 배너를 둔다. 홈은 고정 머리가 없어 배너도 피드와 함께 스크롤된다.
 * 서버가 User-Agent로 브라우저를 알면 첫 프레임부터 그린다(홈 페이지의 AppClientHint, #510).
 */
export function HomeOpenInAppBanner() {
  const externalBrowser = useIsExternalBrowser();
  return externalBrowser ? <OpenInAppBanner /> : null;
}
