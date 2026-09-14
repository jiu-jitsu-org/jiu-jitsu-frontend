"use client";

import { scheduleAppStoreFallback } from "@/shared/lib/app-link";
import { useOpenInAppHref } from "@/shared/lib/use-open-in-app-href";

/**
 * 외부 브라우저 전용 '앱 열기' 유도 배너 — 앱 웹뷰용 앱바를 대신해 최상단에 선다(#72).
 *
 * 구성: [앱 아이콘] [OSS / 앱에서 더 편하게 볼 수 있어요] [앱으로 보기]
 * 스마트 앱 배너처럼 "무슨 앱인지"가 먼저 보여야 한다 — 문구 한 줄 + 버튼만 있으면 어느 앱으로
 * 가는지 알 수 없어 탭을 망설이게 된다. 아이콘·이름은 App Store에서 보게 될 것과 같은 것을 쓴다.
 *
 * WHY AppBarShell을 쓰지 않는가: 셸은 높이 44(h-11) 고정이 계약인데 이 배너는 아이콘+두 줄 문구라
 * 더 높다. safe-area를 흰 배경으로 덮는 처리만 같은 방식으로 맞춘다.
 *
 * FIXME(디자인): 디자인 가이드 출시 전까지의 임시 시안이다. 문구·레이아웃은 확정 후 교체한다.
 */
export function OpenInAppBanner() {
  const openInAppHref = useOpenInAppHref();

  return (
    <div className="box-content bg-[var(--bw-true-white)] pt-[env(safe-area-inset-top)]">
      <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3">
        {/* 앱 아이콘 — iOS 홈 화면 아이콘과 같은 라운드(약 22%)를 준다. 정적 자산이라 next/image 불필요. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/app-icon.png"
          alt=""
          width={40}
          height={40}
          className="size-10 shrink-0 rounded-[9px]"
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-body-m truncate text-text-primary">OSS</p>
          <p className="text-label-m truncate text-text-tertiary">
            앱에서 더 편하게 볼 수 있어요
          </p>
        </div>

        {/*
          반드시 <a href>여야 한다 — iOS는 사용자의 실제 링크 탭에만 반응하고
          onClick + router.push 같은 스크립트 내비게이션에는 반응하지 않는다(#72 실측).
          onClick은 이동을 대신하는 게 아니라 미설치 폴백 타이머만 건다.
        */}
        <a
          href={openInAppHref}
          onClick={() => scheduleAppStoreFallback()}
          className="text-button-s inline-flex h-8 shrink-0 items-center justify-center rounded-[10px] bg-button-filled-default-bg px-3 text-button-filled-default-text"
        >
          앱으로 보기
        </a>
      </div>
    </div>
  );
}
