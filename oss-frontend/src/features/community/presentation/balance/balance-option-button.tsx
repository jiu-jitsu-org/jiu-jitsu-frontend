"use client";

import type {
  BalanceGameOption,
  BalanceOptionKey,
} from "@/features/community/domain/balance-game";
import type { BalanceOptionResult } from "@/features/community/presentation/balance/balance-result";
import { cn } from "@/shared/lib/cn";

/**
 * 밸런스 게임 선택지 버튼 한 개.
 *
 * 상태는 상위가 소유(controlled) — 버튼은 표현만 하고 탭을 콜백으로 위임한다(FeedCard와 같은 철학).
 *
 * 리스트에서는 투표율(%)도 진행률 바도 그리지 않는다(percent/result 토큰은 상세 전용).
 * 대신 색과 **캐릭터 크기**로 상태를 드러낸다 — 고른 쪽이 커지고 밀려난 쪽이 작아진다.
 *
 * 색은 A(빨강)/B(파랑)로 갈리고 상태로 또 갈려, 클래스 조합을 A/B 한 벌씩 표로 둔다.
 * Tailwind는 동적 클래스명을 못 읽으므로 문자열 보간이 아니라 정적 클래스여야 한다.
 */

/**
 * 선택지 표시 상태.
 *
 * default와 unselected를 나눈 이유: 행 배경도 글자색도 같지만 **캐릭터가 다르다**(디자인 실측).
 * 투표 전에는 회색 캐릭터가 곁눈질을 하고, 투표가 끝나면 양쪽 다 색이 들어오면서 고른 쪽은
 * 커지고 밀려난 쪽은 작아진다. "선택됨 여부" 하나로는 이 셋을 구분할 수 없다.
 */
export type BalanceOptionState = "default" | "selected" | "unselected";

/**
 * 상태별 캐릭터 크기(디자인 실측). 세 값의 종횡비가 58:66으로 모두 같다 — 같은 아트워크의 배율이다.
 *
 * **행 높이를 이 값이 결정한다.** 캐릭터는 행 좌측에 여백 없이 붙어 위아래를 꽉 채우고, 행에는
 * 세로 패딩이 없다. 그래서 문구가 짧은 한 행 높이 = 캐릭터 높이가 된다.
 */
const CHARACTER_SIZE: Record<BalanceOptionState, string> = {
  default: "h-[66px] w-[58px]",
  selected: "h-[81.93px] w-[72px]",
  unselected: "h-[54.62px] w-[48px]",
};

/**
 * 상태별 캐릭터 아트워크(174×198 = 58×66의 @3x, 알파 있음).
 *
 * 파일명이 색(빨강/파랑)이 아니라 선택지 키(A/B)를 따르는 이유: 어느 쪽이 무슨 색인지는
 * OPTION_STYLES의 poll-option-a/b 토큰이 이미 정한다. 파일명까지 색으로 부르면 색의 출처가
 * 둘이 되어, 토큰만 바뀌었을 때 자산이 조용히 어긋난다.
 *
 * 아트워크 자체가 상태를 말한다(디자인 원본의 표정 변형):
 * - default = 곁눈질하는 **회색** 캐릭터. A/B 모두 무채색이고 고개 방향만 좌우로 갈린다.
 * - selected = 눈을 크게 뜬 컬러, unselected = 눈이 처진 컬러.
 *
 * 즉 투표 전에는 행 배경만 색을 내고 캐릭터는 무채색이다가, 투표하는 순간 캐릭터에 색이 든다.
 * 캐릭터 뒤에는 어떤 상태에서도 배경을 깔지 않는다 — 행 배경이 그대로 비쳐야 한다(디자인).
 *
 * 경로는 런타임 문자열이라 보간해도 되지만 표로 편다 — 자산 6개가 코드에 그대로 드러나
 * 빠진 상태를 눈으로 잡을 수 있다.
 */
const CHARACTER_SRC: Record<
  BalanceOptionKey,
  Record<BalanceOptionState, string>
> = {
  A: {
    default: "/images/balance/character-a-default.png",
    selected: "/images/balance/character-a-selected.png",
    unselected: "/images/balance/character-a-unselected.png",
  },
  B: {
    default: "/images/balance/character-b-default.png",
    selected: "/images/balance/character-b-selected.png",
    unselected: "/images/balance/character-b-unselected.png",
  },
};

/**
 * 선택지별 클래스. key로 뽑아 쓴다(Tailwind가 동적 클래스명을 읽지 못한다).
 *
 * A가 빨강, B가 파랑이다. default는 투표 전과 밀려난 상태가 함께 쓴다 — 그 둘은 행 배경도
 * 글자색도 같고 캐릭터만 갈리기 때문이다(BalanceOptionState 주석 참조).
 */
const OPTION_STYLES = {
  A: {
    default: "bg-poll-option-a-default-bg text-poll-option-a-default-text",
    selected: "bg-poll-option-a-selected-bg text-poll-option-a-selected-text",
    emphasizedTrack:
      "bg-poll-option-a-selected-bg-track text-poll-option-a-selected-text",
    emphasizedFill: "bg-poll-option-a-selected-bg",
    emphasizedPercent: "text-poll-option-a-selected-percent-text",
    resultTrack:
      "bg-poll-option-a-result-bg-track text-poll-option-a-result-text",
    resultFill: "bg-poll-option-a-result-bg-fill",
    resultPercent: "text-poll-option-a-result-percent-text",
  },
  B: {
    default: "bg-poll-option-b-default-bg text-poll-option-b-default-text",
    selected: "bg-poll-option-b-selected-bg text-poll-option-b-selected-text",
    emphasizedTrack:
      "bg-poll-option-b-selected-bg-track text-poll-option-b-selected-text",
    emphasizedFill: "bg-poll-option-b-selected-bg",
    emphasizedPercent: "text-poll-option-b-selected-percent-text",
    resultTrack:
      "bg-poll-option-b-result-bg-track text-poll-option-b-result-text",
    resultFill: "bg-poll-option-b-result-bg-fill",
    resultPercent: "text-poll-option-b-result-percent-text",
  },
} as const;

export function BalanceOptionButton({
  option,
  state,
  /**
   * 이 선택지를 눌러 투표 상태가 바뀔 수 있는지(정책 + 마감 여부).
   *
   * 표현(커서)에만 쓴다. 실제 차단은 투표 훅이 하고, 둘은 balance-vote-policy라는 같은
   * 출처를 읽는다 — 커서는 되는데 눌러도 안 되는(또는 그 반대) 어긋남을 막기 위해서다.
   */
  interactive,
  /**
   * 투표율·진행률 바. null이면 그리지 않는다.
   *
   * 리스트는 항상 null이라 카드 높이가 투표 전후로 변하지 않는다(복귀 시 스크롤이 튀지 않도록).
   * 결과를 그릴지 말지는 정책이라 balance-result가 판단하고, 이 컴포넌트는 받은 대로 그린다.
   */
  result = null,
  onPress,
}: {
  option: BalanceGameOption;
  state: BalanceOptionState;
  interactive: boolean;
  result?: BalanceOptionResult | null;
  onPress: () => void;
}) {
  const styles = OPTION_STYLES[option.key];
  const selected = state === "selected";

  /**
   * 결과를 그릴 때는 행 배경이 **트랙**이 되고 그 위에 fill이 얹힌다 — 행 자체가 진행률 바다.
   * 강조(내가 고른 쪽·미마감)와 일반 결과는 fill·트랙·글자색이 통째로 다른 한 벌이다.
   */
  const resultStyles = result
    ? result.emphasized
      ? {
          track: styles.emphasizedTrack,
          fill: styles.emphasizedFill,
          percent: styles.emphasizedPercent,
        }
      : {
          track: styles.resultTrack,
          fill: styles.resultFill,
          percent: styles.resultPercent,
        }
    : null;

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
        // relative는 진행률 fill(절대 배치)의 기준이다. 결과를 안 그려도 무해하다.
        "relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl pr-4 text-left transition-colors",
        // 결과를 그리면 배경이 트랙으로 바뀐다. 아니면 기존 규칙 —
        // 행 배경·글자색은 unselected가 default와 같고, 갈리는 것은 캐릭터뿐이다.
        resultStyles
          ? resultStyles.track
          : selected
            ? styles.selected
            : styles.default,
        interactive && "cursor-pointer",
      )}
    >
      {/*
        진행률 fill — 행 좌측부터 percent만큼 덮는다.

        절대 배치라 행 높이에 관여하지 않는다(높이는 캐릭터가 정한다는 규칙이 그대로 유지된다).
        내용보다 먼저 그려 뒤에 깔리게 하고, 아래 형제들은 relative로 그 위에 올린다.
      */}
      {resultStyles ? (
        <span
          aria-hidden
          className={cn("absolute inset-y-0 left-0", resultStyles.fill)}
          style={{ width: `${result?.percent ?? 0}%` }}
        />
      ) : null}

      {/*
        캐릭터 자리. 좌측에 여백 없이 붙고 상태에 따라 크기가 바뀌며, 그 높이가 곧 행 높이다.
        어떤 상태에서도 뒤에 배경을 깔지 않는다 — 자산에 알파가 있어 행 배경이 그대로 비친다.
      */}
      <span
        aria-hidden
        className={cn("relative shrink-0", CHARACTER_SIZE[state])}
      >
        {/*
          next/image가 아닌 plain img인 이유: 표시 크기가 CHARACTER_SIZE로 이미 고정이라
          srcset도 지연 로딩도 필요 없고(카드가 피드 최상단이라 항상 즉시 보인다), 자산이
          13~26KB뿐이라 최적화 왕복이 오히려 요청만 늘린다.
          (avatar·feed-card가 plain img를 쓰는 이유와는 다르다 — 그쪽은 외부 도메인 때문이다.)

          아트워크 종횡비가 58:66으로 CHARACTER_SIZE 세 값과 모두 같아 contain이면 패널과 정확히
          겹친다. 장식이라 부모 span의 aria-hidden에 묻히도록 alt는 빈 문자열이다.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={CHARACTER_SRC[option.key][state]}
          alt=""
          className="size-full object-contain"
        />
      </span>

      {/*
        문구는 말줄임 없이 다 보여주고 항상 세로 가운데다 — 선택지가 잘리면 투표가 성립하지 않는다.

        세로 패딩이 py-2(16)가 아니라 py-1.5(12)인 이유: 2줄(42) + 패딩이 가장 작은 상태의 캐릭터
        높이(54.62)를 넘으면 캐릭터가 아니라 문구가 행 높이를 정해 버려 실측값이 깨진다.
        12이면 54로 아슬하게 아래에 머문다. 3줄부터는 어차피 문구가 행을 늘리므로 그때 여백이 된다.
      */}
      <span className="relative min-w-0 flex-1 py-1.5 text-body-s break-keep">
        {option.text}
      </span>

      {/*
        투표율. 문구가 몇 줄이든 세로 가운데에 머물도록 행의 flex 정렬을 그대로 따른다.
        자릿수가 바뀌어도(9% ↔ 63%) 위치가 흔들리지 않게 tabular-nums를 준다.
      */}
      {resultStyles ? (
        <span
          className={cn(
            "relative shrink-0 text-body-s tabular-nums",
            resultStyles.percent,
          )}
        >
          {result?.percent ?? 0}%
        </span>
      ) : null}
    </button>
  );
}
