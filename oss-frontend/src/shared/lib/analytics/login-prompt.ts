import type { LoginPromptReason } from "@/shared/lib/native-bridge";

import { currentScreenName } from "./screen-view";
import { track } from "./track";

/**
 * 브라우저의 "앱에서 계속할 수 있어요" 창이 떴다(#577). 앱 웹뷰의 로그인 안내는 앱이 기록한다
 * (`AUTH_LOGIN_PROMPT`의 reason으로, jiu-jitsu-ios#426) — 이 함수는 그 창만 맡는다.
 * from은 지금 화면 이름(모르면 뺌). surface=browser는 웹 태그가 붙인다.
 */
export function trackLoginPromptView(reason: LoginPromptReason): void {
  track("login_prompt_view", { reason, from: currentScreenName() });
}
