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

/**
 * 선택지별 클래스. key로 뽑아 쓴다(Tailwind가 동적 클래스명을 읽지 못한다).
 *
 * character는 좌측 캐릭터 패널의 배경 — 디자인의 #ffc1bd / #b2d0f8이 각각 *-track 토큰과
 * 같은 값이라 하드코딩 없이 토큰으로 쓴다. 선택됨 상태의 track 토큰도 같은 값이라 상태에
 * 관계없이 하나로 둔다.
 */
const OPTION_STYLES = {
  A: {
    default: "bg-poll-option-a-default-bg text-poll-option-a-default-text",
    selected: "bg-poll-option-a-selected-bg text-poll-option-a-selected-text",
    character: "bg-poll-option-a-selected-bg-track",
  },
  B: {
    default: "bg-poll-option-b-default-bg text-poll-option-b-default-text",
    selected: "bg-poll-option-b-selected-bg text-poll-option-b-selected-text",
    character: "bg-poll-option-b-selected-bg-track",
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
        // 좌측 패딩이 없다 — 캐릭터 패널이 행 왼쪽 끝에 붙어 위아래를 꽉 채운다(디자인 실측).
        // 높이는 고정하지 않는다. 문구가 길어지면 행이 늘어나야 하고, 그 최소값(66)은
        // 캐릭터 패널이 만든다.
        "flex w-full items-center gap-2.5 overflow-hidden rounded-xl pr-4 text-left transition-colors",
        selected ? styles.selected : styles.default,
        interactive && "cursor-pointer",
      )}
    >
      {/*
        캐릭터 패널 58×66. 배경색까지가 디자인이고 그 위에 캐릭터 일러스트가 올라간다.

        FIXME(캐릭터 asset): Figma MCP 호출 한도로 파랑 패널을 내려받지 못해 두 쪽 모두 비워 둔다.
        받으면 이 안에 <img>만 넣으면 된다 — 배경색과 크기는 이미 디자인 값이다.
      */}
      <span
        aria-hidden
        className={cn("h-[66px] w-[58px] shrink-0", styles.character)}
      />

      {/*
        문구는 말줄임 없이 다 보여준다 — 선택지가 잘리면 투표가 성립하지 않는다.
        세로 패딩은 3줄 이상으로 늘어났을 때만 의미가 있다(2줄까지는 패널 66이 높이를 잡는다).
      */}
      <span className="min-w-0 flex-1 py-2 text-body-s break-keep">
        {option.text}
      </span>
    </button>
  );
}
