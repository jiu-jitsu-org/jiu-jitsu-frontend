import type { OpenInAppResult } from "@/shared/lib/app-link";

import { contentOfPath } from "./content";
import { track } from "./track";

/**
 * 브라우저의 '앱으로 보기'(배너 `web_banner`) · '앱에서 계속하기'(창 `web_dialog`)를 누른 결과(#579).
 * 결과(앱이 떴는지 · 스토어로 넘겼는지)가 정해질 때 한 번 남긴다. 대상 종류는 지금 보고 있는 상세.
 */
export function trackOpenAppClick(
  from: "web_banner" | "web_dialog",
  result: OpenInAppResult,
): void {
  track("open_app_click", {
    content_type: contentOfPath(window.location.pathname)?.type,
    from,
    result,
  });
}
