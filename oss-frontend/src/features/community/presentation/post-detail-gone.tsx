"use client";

import Link from "next/link";
import { useEffect } from "react";

import { OpenInAppBanner } from "@/features/community/presentation/open-in-app-banner";
import { cn } from "@/shared/lib/cn";
import { trackErrorShown } from "@/shared/lib/analytics/error-shown";
import {
  closeNativeSubview,
  isNativeBridgeAvailable,
  useIsExternalBrowser,
  whenWebViewReady,
} from "@/shared/lib/native-bridge";
import { enqueuePendingToast } from "@/shared/ui";
import { buttonVariants } from "@/shared/ui/button";

/** 사유를 구분하지 않는 문구 — 404는 삭제 · 신고 · 차단 · 숨김이 모두 수렴한다. */
const GONE_MESSAGE = "삭제된 게시글이에요";

/**
 * 열 수 없는 게시글에 진입했을 때의 처리 (#41).
 *
 * WHY 404 화면을 그리지 않는가: 목록에서 카드를 탭했는데 빈 에러 화면이 뜨면 사용자는 자기가
 * 뭘 잘못했는지 알 수 없다. 삭제 · 숨기기와 마찬가지로 화면을 닫고 목록에서 안내하는 편이 일관된다.
 *
 * 토스트를 여기서 띄우지 않는 이유: 이 화면은 곧 닫히므로 여기 띄운 토스트는 웹뷰와 함께 사라진다.
 * 문구만 남기고 목록이 대신 띄운다(shared/ui/pending-toast).
 *
 * 목록에서 카드가 사라지는 것은 여기서 관여하지 않는다 — 복귀 시 단건 재조회가 404를 받아
 * 걷어낸다(#73). 이 화면은 "닫고 안내"까지만 책임진다.
 *
 * 브라우저(공유 링크로 연 지워진 글)는 닫을 곳이 없어 이 화면이 남는다 — 앱 배너와 홈으로 가는 길을
 * 붙여 막다른 화면이 되지 않게 한다(#518). 글자 · 버튼은 없음 화면(FallbackScreen)과 같은 모양이다.
 *
 * 오류 기록(`error_shown` not_found, #583)은 앱 · 브라우저 모두 남긴다. 앱에서는 닫기를 WEBVIEW_READY 뒤로 미룬다 —
 * 기록은 WEBVIEW_READY 뒤에 앱으로 넘어가므로(track), 먼저 닫기를 보내면 웹뷰가 기록보다 먼저 사라질 수 있다.
 */
export function PostDetailGone() {
  const externalBrowser = useIsExternalBrowser();

  useEffect(() => {
    trackErrorShown({ type: "not_found", contentType: "post" });
    if (!isNativeBridgeAvailable()) return;

    enqueuePendingToast(GONE_MESSAGE, { tone: "info" });
    whenWebViewReady(closeNativeSubview);
  }, []);

  if (externalBrowser) {
    return (
      <div className="flex min-h-dvh flex-col">
        <OpenInAppBanner />
        <main className="flex flex-1 flex-col items-center justify-center px-6 text-center motion-safe:animate-fade-in">
          <h1 className="text-body-m text-empty-state-default-title-text">
            {GONE_MESSAGE}
          </h1>
          <p className="mt-1 text-body-s text-empty-state-default-description-text">
            작성자가 지웠거나 볼 수 없는 글이에요.
          </p>
          <div className="mt-[13px] flex h-[38px] items-center">
            <Link
              href="/"
              className={cn(buttonVariants({ variant: "neutral", size: "m" }))}
            >
              다른 글 보러 가기
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    // 빈 화면과 같이 8px 아래에서 올라오며 나타난다(앱에서 닫히기 전 잠깐 보인다).
    <div className="flex min-h-dvh flex-col items-center justify-center gap-2 px-6 text-center motion-safe:animate-rise-in">
      <p className="text-body-m text-text-primary">{GONE_MESSAGE}</p>
    </div>
  );
}
