"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  trackErrorShown,
  type ErrorShownDetail,
} from "@/shared/lib/analytics/error-shown";
import { cn } from "@/shared/lib/cn";
import {
  closeNativeSubview,
  isNativeBridgeAvailable,
  useNativeLeaveGuard,
} from "@/shared/lib/native-bridge";
import { Button, buttonVariants } from "@/shared/ui/button";

/** 대체 화면이 떠 있는 자리 — 자리마다 나갈 길이 다르다. */
type FallbackPlace = "subview" | "tab" | "browser";

/**
 * 앱이 탭으로 띄우는 웹 첫 화면(iOS CommunityFeature `/`, CompetitionTabFeature `/competition`).
 * 탭은 닫을 곳이 없어 닫기 대신 다시 시도만 둔다. 나머지 웹 화면은 앱에서 모두 서브뷰다.
 */
const NATIVE_TAB_PATHS = new Set(["/", "/competition"]);

const subscribeNoop = () => () => {};

function readPlace(): FallbackPlace {
  if (!isNativeBridgeAvailable()) return "browser";
  return NATIVE_TAB_PATHS.has(window.location.pathname) ? "tab" : "subview";
}

/**
 * 없음 · 오류 화면 공통 틀 (#503) — 한국어 안내 + 지금 자리에서 나갈 길.
 *
 * | 자리 | 버튼 |
 * |---|---|
 * | 앱 서브뷰 | (다시 시도) + 닫기 |
 * | 앱 탭 첫 화면 | 다시 시도 |
 * | 브라우저 | (다시 시도) + browserLink(기본: 홈으로) |
 *
 * WHY: 앱 서브뷰는 웹 헤더가 뒤로가기를 맡는데, 이 화면에는 헤더가 없다. 글쓰기 · 수정은 앱이 스와이프도
 * 웹에 넘겨(이탈 가드) 버튼이 없으면 앱을 꺼야 나갈 수 있었다.
 *
 * 이탈 가드는 끈다(SET_LEAVE_GUARD false) — 앱은 글쓰기 · 수정 주소면 처음부터 가드를 켜 스와이프를 웹에
 * 넘기는데, 가드를 끄는 쪽은 작성 화면뿐이라 이 화면이 대신 뜨면 스와이프로 나갈 수 없었다. 혹시 가드가 남아
 * BACK_PRESSED가 오면 닫는다. 브라우저에서는 보낼 곳이 없어 아무 일도 하지 않는다.
 *
 * PAGE_READY(`NativePageReady`)는 보내지 않는다 — 앱은 이걸 보고 "정상 화면"으로 여겨 가드를 켠다
 * (jiu-jitsu-ios#352). 덮개는 문서 로드 완료(didFinish)에 걷힌다.
 *
 * 자리는 브릿지 · 주소로 정하므로 서버에서는 알 수 없다 — 서버는 브라우저 모양으로 그리고 하이드레이션 뒤
 * 바뀐다. 버튼 줄 높이를 고정해 바뀌어도 문구가 움직이지 않게 한다.
 *
 * `errorShown`을 넘기면 화면이 붙을 때 오류 기록(`error_shown`, #583)을 한 번 남긴다. 다시 시도해도 이 화면이
 * 남아 있으면 다시 세지 않는다. 디자인 시스템 문서의 견본은 넘기지 않아 남기지 않는다.
 * 브라우저 링크는 `<a>`다 — 루트 레이아웃이 깨진 global-error에서도 문서를 새로 받아 확실히 벗어나게.
 */
export function FallbackScreen({
  title,
  description,
  onRetry,
  retrying = false,
  browserLink = { href: "/", label: "홈으로" },
  errorShown,
}: {
  title: string;
  description?: string;
  /** 다시 시도 — 없으면 버튼을 두지 않는다(없는 주소처럼 다시 해도 같은 결과일 때). */
  onRetry?: () => void;
  /** 다시 시도 요청 중 — 연타를 막는다. */
  retrying?: boolean;
  browserLink?: { href: string; label: string };
  /** 오류 기록에 실을 것. 없으면 남기지 않는다. */
  errorShown?: ErrorShownDetail;
}) {
  const place = useSyncExternalStore(subscribeNoop, readPlace, () => "browser" as const);
  useNativeLeaveGuard(false, closeNativeSubview);
  const showRetry = onRetry !== undefined || place === "tab";
  const recordError = errorShown !== undefined;

  // 붙을 때 한 번 — 부르는 쪽이 매 렌더 새 객체를 넘겨도 다시 세지 않는다.
  useEffect(() => {
    if (recordError) trackErrorShown(errorShown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // 상세 조회 실패(DetailErrorState)와 같은 자리 · 같은 fade-in.
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center motion-safe:animate-fade-in">
      <h1 className="text-body-m text-empty-state-default-title-text">{title}</h1>
      {description ? (
        <p className="mt-1 text-body-s text-empty-state-default-description-text">
          {description}
        </p>
      ) : null}
      <div className="mt-[13px] flex h-[38px] items-center gap-2">
        {showRetry ? (
          <Button
            variant="neutral"
            size="m"
            disabled={retrying}
            // 탭 첫 화면에 onRetry가 없으면(없는 주소 등) 문서를 다시 받는다.
            data-ga="retry"
            onClick={onRetry ?? (() => window.location.reload())}
          >
            다시 시도
          </Button>
        ) : null}
        {place === "subview" ? (
          <Button data-ga="close" variant="neutral" size="m" onClick={closeNativeSubview}>
            닫기
          </Button>
        ) : null}
        {place === "browser" ? (
          <a
            href={browserLink.href}
            className={cn(buttonVariants({ variant: "neutral", size: "m" }))}
          >
            {browserLink.label}
          </a>
        ) : null}
      </div>
    </main>
  );
}
