"use client";

import { useEffect, useId, useState } from "react";

import type { BalanceOptionKey } from "@/features/community/domain/balance-game";
import type { BalanceOptionState } from "@/features/community/presentation/balance/balance-option-button";
import { cn } from "@/shared/lib/cn";

/*
 * 밸런스 게임 캐릭터(#305) — 선택지 행(BalanceOptionButton)과 스코어보드(BalanceHeroBoard)가 함께 쓴다.
 * 그림·눈·대결/맞물림 동작은 선택지 행에 있던 것을 그대로 옮겼다. 크기와 자르기는 놓이는 쪽이 정한다.
 */

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
  },
  B: {
    src: "/images/balance/character-b-idle.png",
    motion: "motion-safe:animate-balance-idle-b",
    pupil: "motion-safe:animate-balance-pupil-b",
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

/** 노려보는 눈동자 자리 — 대결에서 상대를 노려볼 때와 같은 값(그림 좌표 5, 198의 2.5253%. balance-pupil-a/b). */
const GLARE_PUPIL: Record<BalanceOptionKey, string> = {
  A: "translate-y-[2.5253%]",
  B: "-translate-y-[2.5253%]",
};

/** 눈꺼풀 선 — 그림 좌표(174×198). 흰자와 눈동자 창이 같은 선으로 잘린다. */
const EYE_LID_POINTS = "40,88 80,94 84,94 126,86 126,124 40,124";

/** 그림 좌표(174×198)를 칸 전체 = 1인 단위로 옮긴다(BalanceIdleEyes의 눈동자 창). */
const EYE_BOX = `scale(${1 / 174} ${1 / 198})`;

/**
 * 투표 전 캐릭터의 눈 — 몸통 그림(174×198)과 같은 좌표계의 SVG라 그림과 함께 커지고 기운다.
 *
 * 흰자 위를 비스듬한 눈꺼풀 선으로 잘라 미간 쪽이 낮은 "노려보는" 눈을 만든다.
 * 눈동자는 흰자 안에서만 보이고(clipPath) 위아래로만 움직인다 — 위로 가면 눈꺼풀에 반쯤 묻힌다.
 * clipPath id는 카드가 여러 장이어도 겹치지 않게 useId로 만든다.
 *
 * 눈동자는 흰자와 다른 SVG에 그린다(#317). SVG 안쪽 요소를 움직이면 그 SVG 전체를 매 프레임 다시 그리지만,
 * SVG 자체를 움직이면 이미 그려 둔 그림을 옮기기만 한다. 그래서 움직이는 쪽을 눈동자 SVG 통째로 두고,
 * 눈 모양으로 잘라 주는 창은 가만히 있는 바깥 겹이 맡는다. 창은 HTML 요소에 걸려 칸 크기를 따라가야 하므로
 * objectBoundingBox(칸 전체 = 1) 단위이고, EYE_BOX로 그림 좌표를 그 단위로 옮긴다.
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
  const lidBox = `${id}-lid-box`;
  const pupilWindow = `${id}-pupil-window`;
  return (
    <>
      <svg viewBox="0 0 174 198" className="absolute inset-0 size-full">
        <defs>
          <clipPath id={lid}>
            <polygon points={EYE_LID_POINTS} />
          </clipPath>
          <clipPath id={lidBox} clipPathUnits="objectBoundingBox">
            <polygon points={EYE_LID_POINTS} transform={EYE_BOX} />
          </clipPath>
          <clipPath
            id={pupilWindow}
            clipPathUnits="objectBoundingBox"
            clipPath={`url(#${lidBox})`}
          >
            <ellipse cx="66" cy="96" rx="11" ry="12" transform={EYE_BOX} />
            <ellipse cx="101" cy="95" rx="16" ry="13" transform={EYE_BOX} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${lid})`}>
          <ellipse cx="66" cy="96" rx="11" ry="12" fill="white" />
          <ellipse cx="101" cy="95" rx="16" ry="13" fill="white" />
        </g>
      </svg>
      <span
        className="absolute inset-0"
        style={{ clipPath: `url(#${pupilWindow})` }}
      >
        <svg
          viewBox="0 0 174 198"
          className={cn(
            "absolute inset-0 size-full",
            glare ? GLARE_PUPIL[optionKey] : IDLE_STYLES[optionKey].pupil,
          )}
        >
          <circle cx="70" cy="98" r="4.8" fill="#111" />
          <circle cx="108" cy="97" r="5.8" fill="#111" />
        </svg>
      </span>
    </>
  );
}

/**
 * 캐릭터 한 마리 — 놓인 칸을 꽉 채운다(size-full). 칸이 58:66 비율이어야 그림과 정확히 겹친다.
 *
 * 마운트 이후 상태가 한 번이라도 바뀌었을 때만 일회성 동작(보잉·시무룩)을 한다 — 피드에 돌아올
 * 때마다 튀면 사용자가 한 일 없이 화면이 움직이는 셈이다(BalanceOptionButton의 changed와 같은 규칙).
 */
export function BalanceCharacter({
  optionKey,
  state,
  interactive,
  className,
}: {
  optionKey: BalanceOptionKey;
  state: BalanceOptionState;
  /** 마감 전이고 누를 수 있는 자리인지 — 아니면 대결·맞물림 동작 없이 가만히 있다. */
  interactive: boolean;
  className?: string;
}) {
  const idle = state === "default" && interactive;
  const gloat = state !== "default" && interactive;
  const glaring = gloat && state === "selected";

  // 상태가 바뀔 때 그림이 비지 않게 세 그림을 미리 받아 둔다(#310) — 처음 고를 때 밀려난 쪽 그림을
  // 그제야 받으면, 받는 동안 몸통이 사라졌다가 툭 나타난다.
  useEffect(() => {
    for (const src of [IDLE_STYLES[optionKey].src, ...Object.values(CHARACTER_SRC[optionKey])]) {
      new Image().src = src;
    }
  }, [optionKey]);

  const [lastState, setLastState] = useState(state);
  const [changed, setChanged] = useState(false);
  if (lastState !== state) {
    setLastState(state);
    setChanged(true);
  }

  return (
    // 대결 동작은 이 겹이 한다 — 바깥 칸은 가만히 밑단만 자르고, 그림과 색 겹이 함께 커지고 기운다.
    <span
      className={cn(
        "relative block size-full origin-bottom",
        idle && IDLE_STYLES[optionKey].motion,
        gloat &&
          (glaring
            ? GLOAT_STYLES[optionKey].gloat
            : GLOAT_STYLES[optionKey].cower),
        className,
      )}
    >
      {/*
        고르는 순간의 보잉·시무룩은 몸통과 눈을 한 겹으로 묶어 함께 움직인다(#310). 몸통 그림에만 걸면
        몸통이 웅크렸다 솟는 동안 눈은 제자리에 떠 있어, 눈만 남았다가 몸통이 튀어나오는 것처럼 보였다.
      */}
      <span
        className={cn(
          "relative block size-full origin-bottom",
          changed && CHARACTER_MOTION[state],
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            idle || glaring
              ? IDLE_STYLES[optionKey].src
              : CHARACTER_SRC[optionKey][state]
          }
          alt=""
          className="size-full object-contain"
        />
        {idle || glaring ? (
          <BalanceIdleEyes optionKey={optionKey} glare={glaring} />
        ) : null}
      </span>
    </span>
  );
}
