"use client";

import { useState } from "react";

import type {
  BalanceGameOption,
  BalanceOptionKey,
} from "@/features/community/domain/balance-game";
import type { BalanceOptionResult } from "@/features/community/presentation/balance/balance-result";
import { useCountUp } from "@/features/community/presentation/balance/use-count-up";
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
 * 상태가 바뀐 직후 캐릭터가 하는 동작(B안 "보잉", motion.css).
 *
 * - selected = 웅크렸다 쭉 늘며 솟았다가 납작하게 착지
 * - unselected = 시무룩하게 좌우로 흔들림
 * - default(취소로 돌아옴)는 따로 동작이 없다 — 크기 스프링만으로 돌아간다
 *
 * 클래스가 붙는 순간 재생되므로 상태가 바뀌면 자동으로 다시 돈다(A → B: A가 sulk, B가 boing).
 */
const CHARACTER_MOTION: Record<BalanceOptionState, string | null> = {
  default: null,
  selected: "motion-safe:animate-balance-boing",
  unselected: "motion-safe:animate-balance-sulk",
};

/** 투표율 숫자를 굴리는 시간 — fill 스프링(1s)이 거의 멈출 즈음 숫자도 멈춘다. */
const PERCENT_COUNT_MS = 900;

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
   * 이 선택지를 눌러 투표 상태가 바뀔 수 있는지 — 지금은 마감 여부 하나로 갈린다.
   *
   * 표현(커서)에만 쓴다. 실제 차단은 투표 훅이 한다. 마감 전에는 취소·변경이 자유라
   * 선택지마다 답이 갈리지 않는다(#171).
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
   * 마운트 이후 상태가 한 번이라도 바뀌었는지 — 일회성 모션(캐릭터·숫자·fill 등장)의 스위치.
   *
   * 마운트 때부터 이미 투표한 상태면 아무것도 재생하지 않는다. 피드에 돌아올 때마다, 상세를
   * 열 때마다 캐릭터가 튀면 사용자가 한 일 없이 화면이 움직이는 셈이다. 모션은 "눌렀다"에 대한
   * 대답이어야 한다. (크기·막대 너비의 transition은 값이 바뀔 때만 돌아 이 스위치가 필요 없다.)
   *
   * 렌더 중 보정이라 이펙트 왕복 없이 상태가 바뀐 바로 그 렌더에 클래스가 붙는다.
   */
  const [lastState, setLastState] = useState(state);
  const [changed, setChanged] = useState(false);
  if (lastState !== state) {
    setLastState(state);
    setChanged(true);
  }

  const shownPercent = useCountUp(result?.percent ?? 0, {
    animate: changed,
    durationMs: PERCENT_COUNT_MS,
  });

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
        "relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl pr-4 text-left transition-colors duration-200",
        // 누름 반응: 누르는 동안 세로로 납작하게 눌렸다가(0.1s), 떼면 스프링으로 출렁이며 돌아온다
        // (0.7s). 누를 때와 뗄 때 속도가 달라야 해서 :active 쪽 transition을 따로 덮어쓴다.
        // scale은 Tailwind v4에서 transform이 아니라 개별 scale 속성이라 transition 대상도 scale이다.
        "motion-safe:[transition:background-color_200ms_ease,color_200ms_ease,scale_700ms_var(--ease-spring-wobbly)]",
        "motion-safe:active:scale-x-95 motion-safe:active:scale-y-90 motion-safe:active:[transition:background-color_200ms_ease,color_200ms_ease,scale_100ms_ease-out]",
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

        처음 나타날 때(투표 직후)는 0에서 출렁이며 차오르고(fill-in), 이미 떠 있는 상태에서
        비율이 바뀌면(A → B 변경) width transition이 같은 스프링으로 옮겨 간다.
      */}
      {resultStyles ? (
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-0 left-0 transition-colors duration-200",
            "motion-safe:[transition:width_1000ms_var(--ease-spring-wobbly),background-color_200ms_ease]",
            changed && "motion-safe:animate-balance-fill-in",
            resultStyles.fill,
          )}
          style={{ width: `${result?.percent ?? 0}%` }}
        />
      ) : null}

      {/*
        캐릭터 자리. 좌측에 여백 없이 붙고 상태에 따라 크기가 바뀌며, 그 높이가 곧 행 높이다.
        어떤 상태에서도 뒤에 배경을 깔지 않는다 — 자산에 알파가 있어 행 배경이 그대로 비친다.
      */}
      {/*
        크기 변화도 스프링이다 — 고른 쪽은 커지며 한 번 넘쳤다 돌아오고, 밀려난 쪽은 작아지며
        출렁인다. 높이가 곧 행 높이라 행도 함께 출렁인다(의도된 쫀득함).
      */}
      <span
        aria-hidden
        className={cn(
          "relative shrink-0",
          "motion-safe:transition-[width,height] motion-safe:duration-750 motion-safe:ease-spring-wobbly",
          CHARACTER_SIZE[state],
        )}
      >
        {/*
          next/image가 아닌 plain img인 이유: 표시 크기가 CHARACTER_SIZE로 이미 고정이라
          srcset도 지연 로딩도 필요 없고(카드가 피드 최상단이라 항상 즉시 보인다), 자산이
          13~26KB뿐이라 최적화 왕복이 오히려 요청만 늘린다.
          (avatar·feed-card가 plain img를 쓰는 이유와는 다르다 — 그쪽은 외부 도메인 때문이다.)

          아트워크 종횡비가 58:66으로 CHARACTER_SIZE 세 값과 모두 같아 contain이면 패널과 정확히
          겹친다. 장식이라 부모 span의 aria-hidden에 묻히도록 alt는 빈 문자열이다.

          스쿼시·흔들림의 기준점은 아래 가운데다 — 캐릭터 아래쪽이 행 밑에 잘려 있어, 바닥에
          발을 붙인 채 늘고 줄어야 행에서 "솟아오르는" 것처럼 보인다.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={CHARACTER_SRC[option.key][state]}
          alt=""
          className={cn(
            "size-full origin-bottom object-contain",
            changed && CHARACTER_MOTION[state],
          )}
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

        투표 직후에는 숫자가 굴러 올라가고, 내가 고른 쪽(강조)은 다 올라갈 즈음 한 번 부푼다.
        강조가 붙는 순간 재생되므로 A → B로 바꾸면 새로 고른 쪽이 다시 부푼다.
      */}
      {resultStyles ? (
        <span
          className={cn(
            "relative shrink-0 text-body-s tabular-nums",
            changed &&
              result?.emphasized &&
              "motion-safe:animate-balance-percent-pop",
            resultStyles.percent,
          )}
        >
          {shownPercent}%
        </span>
      ) : null}
    </button>
  );
}
