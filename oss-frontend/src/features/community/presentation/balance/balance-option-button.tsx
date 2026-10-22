"use client";

import { useId, useState } from "react";

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

/**
 * 투표 전(default) 캐릭터의 그림과 대기 동작 — 회색이라 앱이 꺼진 듯 보이던 것을 깨운다.
 *
 * 그림은 투표 뒤와 같은 몸통 색이다. unselected 아트워크에서 눈만 지운 몸통(idle)을 쓰고,
 * 눈은 BalanceIdleEyes가 그 위에 따로 그린다 — 눈동자를 굴려야 해서 그림에 박아 둘 수 없다.
 * 고르는 순간 selected 아트워크(눈 크게 뜬 얼굴)로 바뀐다.
 *
 * 대기 동작은 대결이다(8초, motion.css에 흐름 표) — "너 한 번 나 한 번"이 아니라 한쪽이 솟으면
 * 상대가 움찔하고, 받아쳐 둘이 맞붙어 떨고, 밀어내고 연타하고 반격한다. 웅크렸다 쭉 솟고 납작하게
 * 내려앉는 쫀득한 늘고 줄기로 움직인다. 노려보는 쪽 눈동자는 상대 쪽(A는 아래, B는 위)에 박히고,
 * 당하는 쪽은 얌전하다 — 한 번 작게 움찔하고 눈동자를 상대 쪽으로 옮겨 가만히 본다(시선이 갈라지지 않게).
 * 기세를 잡은 동안 그쪽 띠가 진해진다(tone) — 띠도 대결에 끼어 누를 곳으로 눈이 간다.
 *
 * 커지는 것은 캐릭터뿐이고 띠(누르는 영역)는 그대로다 — 누를 자리가 움직이면 탭이 빗나간다.
 * 캐릭터는 띠 위로는 솟아도 되고(행의 overflow를 풀어 둔다) 남의 띠 위로 올라가도 탭을 가로채지
 * 않게 pointer-events를 끈다. 그림 밑단은 잘린 면이라 띠 아래로는 나가면 안 된다 — 캐릭터 칸이
 * 아래쪽만 자르고(clip-path) 행이 하던 왼쪽 아래 둥근 모서리도 대신 자른다.
 */
const IDLE_STYLES = {
  A: {
    src: "/images/balance/character-a-idle.png",
    motion: "motion-safe:animate-balance-idle-a",
    pupil: "motion-safe:animate-balance-pupil-a",
    tone: "bg-poll-option-a-selected-bg-track motion-safe:animate-balance-tone-a",
  },
  B: {
    src: "/images/balance/character-b-idle.png",
    motion: "motion-safe:animate-balance-idle-b",
    pupil: "motion-safe:animate-balance-pupil-b",
    tone: "bg-poll-option-b-selected-bg-track motion-safe:animate-balance-tone-b",
  },
} as const;

/**
 * 고른 뒤 맞물림 동작(motion.css) — 투표 전 대결이 끝나도 캐릭터가 굳지 않게 한다.
 *
 * 고른 쪽(gloat)은 부풀어 상대 쪽으로 기울며 노려본다. 그림은 대결 때와 같은 눈 없는 몸통에 노려보는 눈을
 * 얹되, 눈동자를 상대 쪽(A는 아래, B는 위)에 박아 둔다. 밀려난 쪽(cower)은 그 순간 납작하게 움츠러들며
 * 상대 반대쪽으로 몸을 빼고 떤다 — 그림은 원래의 눈 처진 얼굴 그대로다.
 * 둘은 같은 3.2초 박자에 같은 렌더에서 붙어 맞물린다. 고르는 순간의 보잉·시무룩(0.8초)이 끝난 뒤 시작한다.
 *
 * 대결과 마찬가지로 캐릭터가 띠 위로 솟으므로 행을 자르지 않고 캐릭터 칸이 밑단만 자른다.
 */
const GLOAT_STYLES = {
  A: {
    gloat: "motion-safe:animate-balance-gloat-a",
    cower: "motion-safe:animate-balance-cower-a",
  },
  B: {
    gloat: "motion-safe:animate-balance-gloat-b",
    cower: "motion-safe:animate-balance-cower-b",
  },
} as const;

/** 노려보는 눈동자 자리 — 대결에서 상대를 노려볼 때와 같은 값(balance-pupil-a/b의 5px). */
const GLARE_PUPIL: Record<BalanceOptionKey, string> = {
  A: "translate-y-[5px]",
  B: "-translate-y-[5px]",
};

/**
 * 투표 전 캐릭터의 눈 — 몸통 그림(174×198)과 같은 좌표계의 SVG라 그림과 함께 커지고 기운다.
 *
 * 흰자 위를 비스듬한 눈꺼풀 선으로 잘라 미간 쪽이 낮은 "노려보는" 눈을 만든다.
 * 눈동자는 흰자 안에서만 보이고(clipPath) 위아래로만 움직인다 — 위로 가면 눈꺼풀에 반쯤 묻힌다.
 * clipPath id는 카드가 여러 장이어도 겹치지 않게 useId로 만든다.
 */
function BalanceIdleEyes({
  optionKey,
  glare = false,
}: {
  optionKey: BalanceOptionKey;
  /** 고른 뒤 — 눈동자를 굴리지 않고 상대 쪽에 박아 둔다(GLOAT_STYLES). */
  glare?: boolean;
}) {
  const id = useId();
  const lid = `${id}-lid`;
  const whites = `${id}-whites`;
  return (
    <svg viewBox="0 0 174 198" className="absolute inset-0 size-full">
      <defs>
        <clipPath id={lid}>
          <polygon points="40,88 80,94 84,94 126,86 126,124 40,124" />
        </clipPath>
        <clipPath id={whites}>
          <ellipse cx="66" cy="96" rx="11" ry="12" />
          <ellipse cx="101" cy="95" rx="16" ry="13" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${lid})`}>
        <ellipse cx="66" cy="96" rx="11" ry="12" fill="white" />
        <ellipse cx="101" cy="95" rx="16" ry="13" fill="white" />
        <g clipPath={`url(#${whites})`}>
          <g
            className={
              glare ? GLARE_PUPIL[optionKey] : IDLE_STYLES[optionKey].pupil
            }
          >
            <circle cx="70" cy="98" r="4.8" fill="#111" />
            <circle cx="108" cy="97" r="5.8" fill="#111" />
          </g>
        </g>
      </g>
    </svg>
  );
}

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
      "bg-poll-option-a-selected-bg-track text-poll-option-a-default-text",
    emphasizedFill:
      "bg-poll-option-a-selected-bg text-poll-option-a-selected-text",
    emphasizedPercent: "text-poll-option-a-selected-percent-text",
    emphasizedFillPercent: "text-poll-option-a-selected-text",
    resultTrack:
      "bg-poll-option-a-result-bg-track text-poll-option-a-result-text",
    resultFill:
      "bg-poll-option-a-result-bg-fill text-poll-option-a-result-text",
    resultPercent: "text-poll-option-a-result-percent-text",
    resultFillPercent: "text-poll-option-a-result-percent-text",
  },
  B: {
    default: "bg-poll-option-b-default-bg text-poll-option-b-default-text",
    selected: "bg-poll-option-b-selected-bg text-poll-option-b-selected-text",
    emphasizedTrack:
      "bg-poll-option-b-selected-bg-track text-poll-option-b-default-text",
    emphasizedFill:
      "bg-poll-option-b-selected-bg text-poll-option-b-selected-text",
    emphasizedPercent: "text-poll-option-b-selected-percent-text",
    emphasizedFillPercent: "text-poll-option-b-selected-text",
    resultTrack:
      "bg-poll-option-b-result-bg-track text-poll-option-b-result-text",
    resultFill:
      "bg-poll-option-b-result-bg-fill text-poll-option-b-result-text",
    resultPercent: "text-poll-option-b-result-percent-text",
    resultFillPercent: "text-poll-option-b-result-percent-text",
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
  /**
   * 표시 전용 — 버튼이 아니라 같은 모양의 span으로 그린다(누름 반응 · 탭 없음).
   *
   * 내 커뮤니티 활동 '밸런스 게임' 목록이 쓴다. 그 목록은 항목 전체가 상세로 가는 버튼이라
   * 안에 또 버튼을 둘 수 없고(중첩 버튼), 목록에서 투표하지도 않는다.
   */
  displayOnly = false,
  onPress,
}: {
  option: BalanceGameOption;
  state: BalanceOptionState;
  interactive: boolean;
  result?: BalanceOptionResult | null;
  displayOnly?: boolean;
  onPress?: () => void;
}) {
  const styles = OPTION_STYLES[option.key];
  const selected = state === "selected";
  // 표시 전용 목록은 투표 전 상태가 없지만, 혹시 와도 누를 수 없는 곳에서 손짓하지 않는다.
  const idle = state === "default" && interactive && !displayOnly;
  // 고른 뒤 맞물림 — 마감 전에만. 마감된 판은 끝난 승부라 가만히 둔다.
  const gloat = state !== "default" && interactive && !displayOnly;
  const glaring = gloat && state === "selected";

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
  const justChanged = lastState !== state;
  if (justChanged) {
    setLastState(state);
    setChanged(true);
  }

  // justChanged도 함께 보는 이유: 상태가 바뀐 그 렌더에서는 changed가 아직 false라, 숫자 훅이
  // "굴리지 않음"으로 읽고 목표값으로 바로 맞춰 버린다(첫 투표 때 숫자가 0에서 올라가지 않았다).
  const shownPercent = useCountUp(result?.percent ?? 0, {
    animate: changed || justChanged,
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
          fillPercent: styles.emphasizedFillPercent,
        }
      : {
          track: styles.resultTrack,
          fill: styles.resultFill,
          percent: styles.resultPercent,
          fillPercent: styles.resultFillPercent,
        }
    : null;

  // 표시 전용이면 같은 모양의 span — 버튼 안에 들어가도 마크업이 유효하다(span은 phrasing content).
  const Root = displayOnly ? "span" : "button";

  return (
    <Root
      {...(displayOnly
        ? {}
        : {
            type: "button" as const,
            // disabled를 쓰지 않는 이유: 투표 후에도 이 버튼은 "내 선택"을 보여주는 정보이고,
            // 비로그인 탭은 로그인 유도로 이어져야 한다(막으면 탭 자체가 죽는다).
            // 실제 차단은 상위 투표 훅이 판단하므로 여기서는 커서만 바꾼다.
            "aria-pressed": selected,
            onClick: onPress,
          })}
      className={cn(
        // 좌측 패딩이 없다 — 캐릭터 패널이 행 왼쪽 끝에 붙어 위아래를 꽉 채운다(디자인 실측).
        // 높이는 고정하지 않는다. 문구가 길어지면 행이 늘어나야 하고, 그 최소값(66)은
        // 캐릭터 패널이 만든다.
        // relative는 진행률 fill(절대 배치)의 기준이다. 결과를 안 그려도 무해하다.
        "relative flex w-full items-center gap-2.5 rounded-xl pr-4 text-left transition-colors duration-200",
        // 대결·맞물림 동작에서 캐릭터가 띠 밖으로 솟도록 그때는 자르지 않는다(IDLE_STYLES·GLOAT_STYLES).
        // 진행률 fill은 자기 칸(아래)이 따로 자르므로 행을 풀어도 띠 밖으로 새지 않는다.
        !idle && !gloat && "overflow-hidden",
        // 누름 반응: 누르는 동안 세로로 납작하게 눌렸다가(0.1s), 떼면 스프링으로 출렁이며 돌아온다
        // (0.7s). 누를 때와 뗄 때 속도가 달라야 해서 :active 쪽 transition을 따로 덮어쓴다.
        // scale은 Tailwind v4에서 transform이 아니라 개별 scale 속성이라 transition 대상도 scale이다.
        // 표시 전용은 누를 수 없으니 눌림 반응을 뺀다(항목 전체의 눌림이 대신한다).
        !displayOnly && [
          "motion-safe:[transition:background-color_200ms_ease,color_200ms_ease,scale_700ms_var(--ease-spring-wobbly)]",
          "motion-safe:active:scale-x-95 motion-safe:active:scale-y-90 motion-safe:active:[transition:background-color_200ms_ease,color_200ms_ease,scale_100ms_ease-out]",
        ],
        // 결과를 그리면 배경이 트랙으로 바뀐다. 아니면 기존 규칙 —
        // 행 배경·글자색은 unselected가 default와 같고, 갈리는 것은 캐릭터뿐이다.
        resultStyles
          ? resultStyles.track
          : selected
            ? styles.selected
            : styles.default,
        interactive && !displayOnly && "cursor-pointer",
      )}
    >
      {/*
        진행률 fill — 행 좌측부터 percent만큼 덮는다.

        fill은 색 면만이 아니라 **문구·투표율을 한 벌 더 담은 겹**이다. 그래서 fill이 지나간 자리의
        글자는 fill 위 색(흰색)으로, 아직 안 간 자리는 트랙 위 색으로 경계에서 정확히 갈린다 —
        차오르는 동안 흰 글자가 연한 트랙에 묻혀 사라지지 않는다.

        움직임은 width가 아니라 translate 한 쌍이다. 창(바깥)이 오른쪽으로 밀려 들어오는 만큼 안의
        글자 겹을 반대로 밀어, 글자는 제자리에 있고 창의 가장자리만 지나간다. 두 값이 같은 시간·같은
        곡선을 타서 매 프레임 정확히 상쇄된다. width는 프레임마다 레이아웃을 다시 계산해 캐릭터 크기
        스프링과 겹치면 바가 끊겨 차올랐다 — translate는 레이아웃 없이 GPU에서만 움직인다.

        창의 폭이 행의 두 배(왼쪽으로 한 행만큼 더 뻗음)인 이유: 스프링이 목표를 넘쳤다 돌아올 때
        100% 근처에서도 창의 왼쪽 끝이 행 안으로 들어와 틈이 보이지 않게 한다.

        곡선은 wobbly가 아니라 gentle이다 — 크게 넘쳤다 되돌아오는 출렁임은 캐릭터에는 맞지만 게이지에
        쓰면 차오르다 물러나 끊겨 보인다. 게이지는 한 번에 미끄러지듯 차고 끝에서만 살짝 넘친다.

        처음 나타날 때(투표 직후)는 0에서 차오르고(fill-in), 이미 떠 있는 상태에서
        비율이 바뀌면(A → B 변경) translate transition이 같은 곡선으로 옮겨 간다.
        층 순서: 아래 겹 문구(z 없음) < fill(z-1) < 캐릭터(z-2).
        fill은 띠 모양으로 잘린 칸(z-1) 안에 든다 — 맞물림 동안 행이 자르지 않아도 띠 밖으로 새지 않는다.
      */}
      {resultStyles ? (
        <span
          aria-hidden
          className="absolute inset-0 z-1 overflow-hidden rounded-xl"
        >
          <span
            className={cn(
              "absolute inset-y-0 -left-full w-[200%] overflow-hidden",
              "transition-colors duration-200",
              "motion-safe:[transition:translate_1000ms_var(--ease-spring-gentle),background-color_200ms_ease,color_200ms_ease]",
              changed && "motion-safe:animate-balance-fill-in",
              resultStyles.fill,
            )}
            style={{ translate: `${((result?.percent ?? 0) - 100) / 2}% 0` }}
          >
            <span
              className={cn(
                "absolute inset-y-0 left-1/2 flex w-1/2 items-center gap-2.5 pr-4",
                "motion-safe:[transition:translate_1000ms_var(--ease-spring-gentle)]",
                changed && "motion-safe:animate-balance-fill-in-content",
              )}
              style={{ translate: `${100 - (result?.percent ?? 0)}% 0` }}
            >
              <span
                className={cn(
                  "shrink-0",
                  "motion-safe:transition-[width,height] motion-safe:duration-750 motion-safe:ease-spring-wobbly",
                  CHARACTER_SIZE[state],
                )}
              />
              <span className="min-w-0 flex-1 py-1.5 text-body-s break-keep">
                {option.text}
              </span>
              <span
                className={cn(
                  "shrink-0 text-body-s tabular-nums",
                  resultStyles.fillPercent,
                )}
              >
                {shownPercent}%
              </span>
            </span>
          </span>
        </span>
      ) : null}

      {/*
        투표 전 띠 물들기(IDLE_STYLES.tone) — 진한 색 겹의 투명도만 움직인다. 행이 대결 동안 자르지
        않으므로 이 겹이 띠 모양(rounded-xl)을 스스로 갖는다. 띠 크기는 그대로라 누르는 자리는 변하지 않는다.
        모션을 끈 사용자에게는 겹이 보이지 않는다(opacity-0이 기본).
      */}
      {idle ? (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 rounded-xl opacity-0",
            IDLE_STYLES[option.key].tone,
          )}
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
          "relative z-2 shrink-0 origin-bottom",
          "motion-safe:transition-[width,height] motion-safe:duration-750 motion-safe:ease-spring-wobbly",
          CHARACTER_SIZE[state],
          (idle || gloat) &&
            "pointer-events-none [clip-path:inset(-50%_-50%_0_0_round_0_0_0_12px)]",
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
        {/* 대결 동작은 이 겹이 한다 — 바깥 칸은 가만히 밑단만 자르고, 그림과 색 겹이 함께 커지고 기운다. */}
        <span
          className={cn(
            "relative block size-full origin-bottom",
            idle && IDLE_STYLES[option.key].motion,
            gloat &&
              (glaring
                ? GLOAT_STYLES[option.key].gloat
                : GLOAT_STYLES[option.key].cower),
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              idle || glaring
                ? IDLE_STYLES[option.key].src
                : CHARACTER_SRC[option.key][state]
            }
            alt=""
            className={cn(
              "size-full origin-bottom object-contain",
              changed && CHARACTER_MOTION[state],
            )}
          />
          {idle || glaring ? (
            <BalanceIdleEyes optionKey={option.key} glare={glaring} />
          ) : null}
        </span>
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

        투표 직후에는 숫자가 바와 함께 굴러 올라간다. 다 올라간 뒤 한 번 더 부풀리지 않는다 —
        바·숫자·캐릭터가 이미 반응했는데 숫자만 늦게 튀면 동작이 하나 더 붙어 산만하다.
      */}
      {resultStyles ? (
        <span
          className={cn(
            "relative shrink-0 text-body-s tabular-nums",
            resultStyles.percent,
          )}
        >
          {shownPercent}%
        </span>
      ) : null}
    </Root>
  );
}
