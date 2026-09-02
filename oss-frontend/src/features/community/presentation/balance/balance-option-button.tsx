"use client";

import type { BalanceGameOption } from "@/features/community/domain/balance-game";
import { cn } from "@/shared/lib/cn";

/**
 * 밸런스 게임 선택지 버튼 한 개.
 *
 * 상태는 상위가 소유(controlled) — 버튼은 표현만 하고 탭을 콜백으로 위임한다(FeedCard와 같은 철학).
 *
 * 리스트에서는 투표율(%)도 진행률 바도 그리지 않는다. 내가 무엇을 골랐는지만 배경색으로 구분한다
 * (percent/result 토큰은 상세 전용이라 여기서 쓰지 않는다). 그 덕분에 **투표 전후 높이가 같아**,
 * 상세에 다녀와도 피드 스크롤이 튀지 않는다 — 이 성질은 의도적으로 지킨다.
 *
 * 색은 A(빨강)/B(파랑)로 갈리고 상태(기본/선택됨)로 또 갈려, 클래스 조합을 A/B 한 벌씩 표로 둔다.
 * Tailwind는 동적 클래스명을 못 읽으므로 문자열 보간이 아니라 정적 클래스여야 한다.
 */

/** 선택지별 배경·글자 클래스. key로 뽑아 쓴다(동적 클래스명 금지). */
const OPTION_STYLES = {
  A: {
    default: "bg-poll-option-a-default-bg text-poll-option-a-default-text",
    selected: "bg-poll-option-a-selected-bg text-poll-option-a-selected-text",
  },
  B: {
    default: "bg-poll-option-b-default-bg text-poll-option-b-default-text",
    selected: "bg-poll-option-b-selected-bg text-poll-option-b-selected-text",
  },
} as const;

export function BalanceOptionButton({
  option,
  selected,
  /**
   * 이 선택지를 눌러 투표 상태가 바뀔 수 있는지(정책 + 마감 여부).
   *
   * 표현(커서)에만 쓴다. 실제 차단은 투표 훅이 하고, 둘은 balance-vote-policy라는 같은
   * 출처를 읽는다 — 커서는 되는데 눌러도 안 되는(또는 그 반대) 어긋남을 막기 위해서다.
   */
  interactive,
  onPress,
}: {
  option: BalanceGameOption;
  selected: boolean;
  interactive: boolean;
  onPress: () => void;
}) {
  const styles = OPTION_STYLES[option.key];

  return (
    <button
      type="button"
      // disabled를 쓰지 않는 이유: 투표 후에도 이 버튼은 "내 선택"을 보여주는 정보이고,
      // 비로그인 탭은 로그인 유도로 이어져야 한다(막으면 탭 자체가 죽는다).
      // 실제 차단은 상위 투표 훅이 판단하므로 여기서는 커서만 바꾼다.
      aria-pressed={selected}
      onClick={onPress}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
        selected ? styles.selected : styles.default,
        interactive && "cursor-pointer",
      )}
    >
      {/*
        이미지 자리. asset이 아직 없어 비워 두되 **영역은 확보**한다 — 나중에 이미지를 넣을 때
        선택지 높이와 텍스트 시작 위치가 달라지면 카드 전체 레이아웃을 다시 맞춰야 하기 때문.
        option.imageUrl(업스트림 값)은 계약으로만 갖고 있고 아직 렌더하지 않는다.
      */}
      <span aria-hidden className="size-10 shrink-0 rounded-lg" />

      {/* 문구는 말줄임 없이 다 보여준다(가변 높이 허용) — 선택지를 잘라 읽히면 투표가 성립하지 않는다. */}
      <span className="min-w-0 flex-1 text-body-s break-keep">
        {option.text}
      </span>
    </button>
  );
}
