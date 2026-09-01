"use client";

import { ChevronDownIcon, TimerIcon } from "@/shared/ui/icons";

/**
 * 밸런스 게임 sticky 바 — 풀 카드가 화면 밖으로 나간 뒤 상단에 고정된다.
 *
 * 순수 뷰다. 언제 보일지(카드가 완전히 벗어났는지 · 미투표인지)는 상위가 판단한다.
 *
 * fixed로 콘텐츠 위를 덮는다. sticky(문서 흐름 유지) 대신 fixed를 쓰는 이유는, 풀 카드가 이미
 * 스크롤 밖으로 나간 뒤에 나타나는 별도 요소라 흐름 안에 자리를 만들면 그만큼 피드가 밀려서다.
 * 배경은 반투명이라 아래 글이 비친다 — 덮고 있다는 사실 자체가 "원래 자리는 위"라는 단서가 된다.
 *
 * 상단 앱바(피드/카테고리)는 네이티브라 이 웹뷰의 top이 곧 앱바 바로 아래다. 다만 웹 단독으로
 * 열렸을 때는 상태바 인셋이 잡히므로 safe-area만큼 밀어 준다(인셋이 없으면 0이라 그대로다).
 */
export function BalanceStickyBar({
  remainingLabel,
  onPress,
}: {
  remainingLabel: string;
  onPress: () => void;
}) {
  return (
    <div className="fixed inset-x-0 top-0 z-20 px-4 pt-[env(safe-area-inset-top)]">
      <button
        type="button"
        onClick={onPress}
        className="mt-2 flex w-full cursor-pointer items-center gap-1 rounded-xl bg-poll-sticky-bar-bg/90 px-4 py-3 text-poll-sticky-bar-text backdrop-blur-sm"
      >
        <TimerIcon size={16} />
        <span className="text-body-s">오늘의 밸런스 게임</span>
        <span aria-hidden className="text-body-s">
          ·
        </span>
        <span className="text-body-s">{remainingLabel}</span>

        {/* 오른쪽 끝 화살표. 전용 chevron-right 아이콘이 아직 없어 down을 -90° 돌려 쓴다. */}
        <ChevronDownIcon
          size={16}
          className="ml-auto -rotate-90 text-poll-sticky-bar-icon"
        />
      </button>
    </div>
  );
}
