"use client";

import { useEffect, useState } from "react";

import { BalanceCharacter } from "@/features/community/presentation/balance/balance-character";
import { BOARD_PALETTE } from "@/features/community/presentation/balance/balance-board-palette";
import {
  type BalanceHeroProps,
  BalanceClock,
  BalanceHeroCommentLink,
  optionStateOf,
  pressOutsideControls,
} from "@/features/community/presentation/balance/balance-hero-parts";
import {
  balanceNumeralFont,
  balanceTitleFont,
} from "@/features/community/presentation/balance/balance-board-fonts";
import { BALANCE_INTRO_COOKIE } from "@/features/community/presentation/balance/balance-intro";
import type { BalanceOptionState } from "@/features/community/presentation/balance/balance-option-button";
import {
  type BalanceOptionResult,
  readOptionResult,
} from "@/features/community/presentation/balance/balance-result";
import type {
  BalanceGameOption,
  BalanceOptionKey,
} from "@/features/community/domain/balance-game";
import { cn } from "@/shared/lib/cn";
import { CheckIcon, TimerIcon } from "@/shared/ui/icons";

/**
 * 매트 스코어보드(#305) — 홈 맨 위 히어로이자 상세 맨 위 판(variant).
 *
 * 주짓수 대회 매트 옆 전광판을 옮겨 온다 — 먹색 판, 한가운데 큰 경기 시계, 그 아래 홍·청 선수
 * 두 줄. 이 앱 사용자에게 가장 익숙한 "대결" 화면이라 설명 없이 읽힌다. 남은 시간이 주인공이 되어
 * "오늘 안에 골라야 한다"는 긴장이 생긴다.
 *
 * 선수 줄은 실제 전광판처럼 왼쪽에 진영 색 블록(캐릭터가 선다), 가운데 이름(선택지), 오른쪽에 점수
 * 자리가 있다. 홈에서는 점수 자리에 숫자 대신 A/B를 두고 고르면 체크로 바뀐다 — 리스트는 투표율을
 * 그리지 않는 정책이라 점수판에 숫자를 지어내지 않는다. 상세에서는 투표했거나 마감되면 득표율이 뜬다.
 *
 * 홈 판은 아래 모서리만 둥글게 끝나 피드와 갈린다. 어두운 면은 이 판 하나뿐이다(앱에 다크 모드는 없다).
 *
 * 스포츠 중계 그래픽처럼 진영 블록의 오른쪽 변을 비스듬히 자른다. 제목은 블랙 한 산스, 경기 시계·A·B·득표율은
 * 카니트(balance-board-fonts).
 */

/** 진영 색 블록 — 전광판의 홍·청. */
const CORNER: Record<BalanceOptionKey, string> = {
  A: "bg-poll-option-a-selected-bg",
  B: "bg-poll-option-b-selected-bg",
};

/** 진영 블록의 오른쪽 변을 기울여 자른다(중계 그래픽의 선수 이름표). */
const CORNER_CLIP = "[clip-path:polygon(0_0,100%_0,calc(100%-14px)_100%,0_100%)]";

/**
 * 캐릭터 키 — 줄 높이에 붙여 잡는다(너비는 58:66 비율로 따라온다). 문구가 1~3줄로 늘어 줄이 높아져도
 * 머리가 늘 같은 만큼(투표 전 16) 줄 위로 삐져나온다. 고르면 더 솟고, 밀려나면 줄 안으로 움츠린다.
 * 줄 사이 간격(20)이 투표 전 삐져나옴을 받아낸다.
 */
/**
 * 투표 뒤 줄 크기 — 고른 줄은 살짝 커지고, 밀려난 줄은 높이·진영 블록·글자가 함께 줄어 한눈에 뒤로 물러난다.
 * 진영 블록 너비는 --corner-w 하나로 정한다 — 블록과 인트로 색 판(fill-retract)이 같은 값을 읽는다.
 */
const ROW_SIZE: Record<BalanceOptionState, string> = {
  default: "min-h-[76px] [--corner-w:100px]",
  selected: "min-h-[84px] [--corner-w:100px]",
  unselected: "min-h-[56px] [--corner-w:80px]",
};

const OPTION_TEXT: Record<BalanceOptionState, string> = {
  default: "py-3 text-title-3",
  selected: "py-3 text-title-3",
  unselected: "py-2 text-body-m",
};

const CHARACTER_SIZE: Record<BalanceOptionState, string> = {
  default: "h-[calc(100%+16px)]",
  selected: "h-[calc(100%+24px)]",
  unselected: "h-[calc(100%-4px)]",
};

/**
 * 캐릭터 자르기 — 줄 바닥과 왼쪽 아래 둥근 모서리(16)에서만 자른다. 위·오른쪽은 열어 둔다.
 *
 * 진영 블록의 기운 변을 따라 자르면, 캐릭터가 대기 동작으로 오른쪽으로 기울 때 몸통·눈이 그 변에서
 * 잘려 줄 뒤로 숨은 것처럼 보인다. 캐릭터는 늘 줄 앞에 선다. 줄이 높아져 캐릭터가 넓어져도 병 바닥은
 * 기운 변을 16px 남짓 넘을 뿐 문구(블록 오른쪽 + 16)까지 닿지 않는다.
 */
const CHARACTER_CLIP = "[clip-path:inset(-80px_-60px_0_0_round_0_0_0_16px)]";

/**
 * 처음 볼 때 인트로 "선수 입장"(#305) — 판의 각 조각에 붙는 등장 동작. 모두 motion-safe라 동작 줄이기면
 * 돌지 않고, backwards 채움이라 끝나면 원래 모습으로 돌아간다(클래스를 떼지 않아도 된다).
 *
 * 시간표(ms, 약 1.6초) — B 줄은 모두 100ms 뒤
 * 제목 0~420 · 시계 60~580 · 줄이 진영 색으로 꽉 찬 채 쓸려 들어옴 200~620 · 잠깐 머문 뒤 색이 진영 블록
 * 자리로 밀려 들어감 750~1140 · 캐릭터 튀어 오름 1060~1680 · 빛 스침 1100 · A·B 도장 1300
 *
 * 지연 클래스는 글자 그대로 적는다 — Tailwind는 소스에 그대로 있는 클래스만 만든다.
 */
const INTRO = {
  header: "motion-safe:animate-balance-intro-title",
  clock: "motion-safe:animate-balance-intro-punch motion-safe:[animation-delay:60ms]",
  row: {
    A: "motion-safe:animate-balance-intro-wipe motion-safe:[animation-delay:200ms]",
    B: "motion-safe:animate-balance-intro-wipe motion-safe:[animation-delay:300ms]",
  },
  fill: {
    A: "motion-safe:animate-balance-intro-fill-retract motion-safe:[animation-delay:200ms]",
    B: "motion-safe:animate-balance-intro-fill-retract motion-safe:[animation-delay:300ms]",
  },
  sheen: {
    A: "motion-safe:animate-balance-intro-sheen motion-safe:[animation-delay:1100ms]",
    B: "motion-safe:animate-balance-intro-sheen motion-safe:[animation-delay:1200ms]",
  },
  character: {
    A: "motion-safe:animate-balance-intro-jump motion-safe:[animation-delay:1060ms]",
    B: "motion-safe:animate-balance-intro-jump motion-safe:[animation-delay:1160ms]",
  },
  letter: {
    A: "motion-safe:animate-balance-intro-stamp motion-safe:[animation-delay:1300ms]",
    B: "motion-safe:animate-balance-intro-stamp motion-safe:[animation-delay:1400ms]",
  },
} satisfies {
  header: string;
  clock: string;
  row: Record<BalanceOptionKey, string>;
  fill: Record<BalanceOptionKey, string>;
  sheen: Record<BalanceOptionKey, string>;
  character: Record<BalanceOptionKey, string>;
  letter: Record<BalanceOptionKey, string>;
};

/** 인트로를 그리지 않을 때 — 조각마다 빈 클래스. */
type IntroParts = Partial<typeof INTRO>;

/** 인트로가 언제까지 쿠키에 남는지(초) — 하루 한 판이라 이틀이면 다음 판 전에 만료된다. */
const INTRO_COOKIE_MAX_AGE = 60 * 60 * 24 * 2;

/**
 * 이 화면(탭)에서 이미 인트로를 돌린 게임 — 뒤로 가기 등으로 히어로가 다시 마운트돼도 또 돌지 않게.
 * 서버는 쿠키로, 같은 탭 안의 재마운트는 이 집합으로 막는다.
 */
const introPlayed = new Set<number>();

export function BalanceHeroBoard({
  game,
  onVote,
  onPressDetail,
  onExpired,
  intro = false,
  variant = "hero",
}: BalanceHeroProps & {
  /**
   * hero: 홈 맨 위 — 아래 모서리만 둥글고, 판 아무 데나 누르면 상세로, 댓글 링크가 붙는다.
   * detail: 상세 맨 위(#305 시안) — 네 모서리가 둥근 판, 투표했거나 마감되면 점수 자리에 득표율이 뜨고
   * 줄 바탕이 그만큼 진영 색으로 찬다. 댓글은 바로 아래 있어 링크를 두지 않는다.
   */
  variant?: "hero" | "detail";
}) {
  const detail = variant === "detail";
  const interactive = !game.closed;
  const palette = BOARD_PALETTE;

  // 첫 렌더에서 한 번 정한다. 서버 렌더에서도 집합은 비어 있어 서버·클라이언트 판단이 같다(하이드레이션 일치).
  // 인트로를 돌린 게임은 마운트 때 한 번 정한다. 마감으로 다음 판이 들어와도 판은 다시 마운트되지 않아
  // 인트로가 다시 돌지 않으므로, 기록도 처음 판 번호로만 남긴다(새 판을 "본 것"으로 적지 않게).
  const [introGameId] = useState(game.contentId);
  const [play] = useState(() => intro && !introPlayed.has(introGameId));
  const parts: IntroParts = play ? INTRO : {};

  // 돌린 게임을 기록한다 — 다음 방문엔 서버가 쿠키를 보고 인트로 없이 그린다.
  useEffect(() => {
    if (!play) return;
    introPlayed.add(introGameId);
    document.cookie = `${BALANCE_INTRO_COOKIE}=${introGameId}; path=/; max-age=${INTRO_COOKIE_MAX_AGE}; samesite=lax`;
  }, [play, introGameId]);

  return (
    <section
      onClick={detail ? undefined : pressOutsideControls(onPressDetail)}
      className={cn(
        "relative flex flex-col overflow-hidden px-4 pt-5",
        detail ? "rounded-[24px] pb-5" : "cursor-pointer rounded-b-[28px] pb-3",
        palette.bg,
        palette.shadow,
        palette.text,
      )}
      aria-label="오늘의 밸런스 게임"
    >
      <header className={cn("flex items-center justify-between px-1", parts.header)}>
        <h2 className={cn(balanceTitleFont.className, "text-[22px] leading-7")}>
          오늘의 밸런스 게임
        </h2>
        {/*
          경기 중 표시 — 중계 화면의 "생중계" 알약. 선수 줄과 같은 옅은 면에 홍 점을 두고, 점 둘레로 물결이
          번진다(동작 줄이기면 멈춘다). 마감되면 점이 회색으로 꺼지고 "종료"로 바뀐다.
        */}
        <span
          className={cn(
            "flex h-7 items-center gap-1.5 rounded-full pr-3 pl-2.5 text-label-m font-semibold",
            palette.row,
            game.closed && palette.muted,
          )}
        >
          <span aria-hidden className="relative flex size-2">
            {game.closed ? null : (
              <span className="absolute inset-0 rounded-full bg-interactive-poll-a motion-safe:animate-ping motion-safe:[animation-duration:1.6s]" />
            )}
            <span
              className={cn(
                "relative size-2 rounded-full",
                game.closed ? "bg-current opacity-60" : "bg-interactive-poll-a",
              )}
            />
          </span>
          {game.closed ? "종료" : "진행 중"}
        </span>
      </header>

      {/* 경기 시계 — 판의 주인공. 숫자가 자리마다 굴러간다. */}
      <div className={cn("mt-4 flex flex-col items-center", parts.clock)}>
        <BalanceClock
          endAt={game.endAt}
          serverTime={game.serverTime}
          onExpired={onExpired}
          // 카니트 엑스트라볼드, 똑바로. 경기 시계가 판의 주인공이다.
          className={cn(
            balanceNumeralFont.className,
            "inline-block text-[60px] leading-[64px] tracking-[-1px]",
          )}
          below={() => <BoardClockLabel closed={game.closed} />}
        />
      </div>

      <div className="mt-6 flex flex-col gap-5">
        <BoardRow
          option={game.optionA}
          state={optionStateOf(game, "A")}
          interactive={interactive}
          intro={parts}
          detail={detail}
          result={detail ? readOptionResult(game, "A") : null}
          onPress={() => onVote("A")}
        />
        <BoardRow
          option={game.optionB}
          state={optionStateOf(game, "B")}
          interactive={interactive}
          intro={parts}
          detail={detail}
          result={detail ? readOptionResult(game, "B") : null}
          onPress={() => onVote("B")}
        />
      </div>

      {detail ? null : (
        <div className="mt-2 flex justify-end">
          <BalanceHeroCommentLink game={game} onPress={onPressDetail} />
        </div>
      )}
    </section>
  );
}

function BoardRow({
  option,
  state,
  interactive,
  intro,
  detail,
  result,
  onPress,
}: {
  option: BalanceGameOption;
  state: BalanceOptionState;
  interactive: boolean;
  intro: IntroParts;
  /** 상세 판인지 — 득표 막대 자리를 늘 깔아 둔다(아래 득표 막대 참조). */
  detail: boolean;
  /** 득표율(상세만) — 있으면 줄이 통째로 켜지는 대신 득표율만큼 진영 색이 차고 점수 자리에 %가 뜬다. */
  result: BalanceOptionResult | null;
  onPress: () => void;
}) {
  const key = option.key;
  const selected = state === "selected";
  const palette = BOARD_PALETTE;

  // 득표 막대의 진하기 — 마지막으로 받은 득표율의 것을 붙잡아 둔다. 투표를 취소하면 득표율이 사라지며 막대가
  // 0으로 줄어드는데, 그 1초 동안 옅던 쪽이 진하게 번쩍이지 않게 줄어드는 내내 원래 진하기를 지킨다.
  const [emphasized, setEmphasized] = useState(result?.emphasized ?? true);
  if (result && result.emphasized !== emphasized) setEmphasized(result.emphasized);

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onPress}
      className={cn(
        "relative flex w-full items-stretch rounded-2xl text-left",
        ROW_SIZE[state],
        // 바탕은 늘 판 위에 한 단 뜬 면(흰 9%). 고르면 그 위로 진영 색이 왼쪽부터 차오른다(아래 차오름 면).
        palette.row,
        // 득표율을 읽어야 하는 상세에서는 밀려난 줄을 덜 끈다.
        state === "unselected" && (result ? "opacity-75" : "opacity-50"),
        "motion-safe:[transition:opacity_300ms_ease,min-height_500ms_var(--ease-spring-wobbly),scale_500ms_var(--ease-spring-wobbly)]",
        "motion-safe:active:scale-[0.98] motion-safe:active:[transition:scale_100ms_ease-out]",
        interactive && "cursor-pointer",
        intro.row?.[key],
      )}
    >
      {/*
        득표 막대(상세) — 줄 바탕이 득표율만큼 진영 색으로 찬다. 내가 고른 쪽은 진하게, 다른 쪽은 옅게
        (마감되면 양쪽 다 옅게 — readOptionResult의 emphasized). 진영 블록이 그 위에 덮여 왼쪽 끝은 늘 블록이다.
      */}
      {/*
        투표 전에도 폭 0으로 깔아 둔다(#310) — 고르는 순간 새로 그리면 다 찬 채로 툭 나타난다. 0에서 득표율까지
        홈의 차오름과 같은 시간·곡선(1초, 부드럽게 멈춤)으로 차오른다. 출렁이는 곡선은 막대가 득표율을 넘쳤다
        돌아와 띠용 하고 튀어 보여 뺐다.
      */}
      {detail ? (
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-0 left-0 rounded-2xl motion-safe:transition-[width] motion-safe:duration-1000 motion-safe:ease-smooth-out",
            CORNER[key],
            emphasized ? "opacity-90" : "opacity-35",
          )}
          style={{ width: `${result?.percent ?? 0}%` }}
        />
      ) : null}

      {/*
        고른 줄 차오름(홈) — 고르면 진영 블록에서 시작해 줄 끝까지 진영 색이 차올라 줄이 통째로 켜진다
        (전광판에서 승자 줄이 켜지듯). 취소하면 같은 길로 빠진다. 득표율을 그리는 상세는 위 득표 막대가 맡는다.
        폭 대신 오른쪽을 잘라(clip-path) 둥근 모서리가 찌그러지지 않는다.
      */}
      {detail ? null : (
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 rounded-2xl motion-safe:transition-[clip-path] motion-safe:duration-1000 motion-safe:ease-smooth-out",
            CORNER[key],
            selected
              ? "[clip-path:inset(0_0_0_0_round_16px)]"
              : "[clip-path:inset(0_100%_0_0_round_16px)]",
          )}
        />
      )}

      {/*
        진영 블록 — 색 면은 기운 변으로 잘리고, 캐릭터는 그 위에 따로 서서 머리가 줄 위로 삐져나온다.
        줄이 통째로 켜지면 블록과 줄이 한 색이라 기운 변이 사라진다 — 그대로 둬도 된다.
      */}
      {/*
        탭은 받지 않는다(pointer-events-none) — 줄 위로 삐져나온 캐릭터 머리가 이웃 줄이나 판의 탭을 가로채지
        않게. 블록 안을 누르면 아래의 줄(버튼)이 그대로 받는다.
      */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none relative shrink-0 motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-spring-wobbly",
          // 너비는 ROW_SIZE의 --corner-w 하나로 정한다 — 인트로 색 판도 같은 값에서 멈춘다.
          "w-[var(--corner-w)]",
        )}
      >
        <span className={cn("absolute inset-0 rounded-l-2xl", CORNER[key], CORNER_CLIP)} />
        <span className={cn("absolute inset-0 flex items-end pl-1", CHARACTER_CLIP)}>
          <span
            className={cn(
              "aspect-[58/66] shrink-0 origin-bottom motion-safe:transition-[height] motion-safe:duration-750 motion-safe:ease-spring-wobbly",
              CHARACTER_SIZE[state],
              intro.character?.[key],
            )}
          >
            <BalanceCharacter optionKey={key} state={state} interactive={interactive} />
          </span>
        </span>
      </span>

      <span
        className={cn(
          "relative flex min-w-0 flex-1 items-center pr-1 pl-6 break-keep",
          OPTION_TEXT[state],
        )}
      >
        {option.text}
        {/* 점수 자리는 낭독기에서 숨겨 두었으므로 득표율은 여기서 읽힌다. */}
        {result ? <span className="sr-only">, {result.percent}%</span> : null}
      </span>

      {/* 인트로 색 판 — 줄을 진영 색으로 꽉 채웠다가 빠진다. 평소엔 보이지 않는다(opacity 0). */}
      {intro.fill ? (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 rounded-2xl opacity-0",
            CORNER[key],
            intro.fill[key],
          )}
        />
      ) : null}

      {/* 인트로 빛 스침 — 이름표가 다 들어온 순간 줄 위를 한 번 지나간다. */}
      {intro.sheen ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden overflow-hidden rounded-2xl motion-safe:block"
        >
          <span
            className={cn(
              "absolute inset-y-0 left-0 w-1/4 -translate-x-[120%] -skew-x-12",
              "bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--bw-true-white)_30%,transparent),transparent)]",
              intro.sheen[key],
            )}
          />
        </span>
      ) : null}

      {/*
        점수 자리 — 숫자 대신 진영 글자. 고르면 체크로 바뀐다. 칸막이 선 없이 작게 둬 문구를 누르지 않고
        "어느 쪽 줄인지"만 귀퉁이에서 말한다. 문구 덩어리와 같은 세로 가운데에 맞춘다.
      */}
      <span
        aria-hidden
        className={cn(
          "relative flex shrink-0 items-center justify-center pr-2",
          result ? "w-16" : "w-10",
        )}
      >
        <span className={cn("flex", intro.letter?.[key])}>
          {result ? (
            <span
              className={cn(
                balanceNumeralFont.className,
                "text-[20px] leading-6 tabular-nums",
                !result.emphasized && "opacity-80",
              )}
            >
              {result.percent}%
            </span>
          ) : selected ? (
            <CheckIcon size={20} />
          ) : (
            <span
              className={cn(balanceNumeralFont.className, "text-[20px] leading-6 opacity-70", palette.muted)}
            >
              {key}
            </span>
          )}
        </span>
      </span>
    </button>
  );
}

/**
 * 시계 밑 "남은 시간" 이름표 — 다른 화면의 남은 시간 표기와 같은 시계 아이콘을 앞에 둔다.
 * 선수 줄과 같은 옅은 면의 알약에 담아 시계 숫자 밑에 조용히 붙인다(아이콘만 앱 파랑).
 * 아이콘은 째깍이지 않는다(#310) — 바로 위 큰 숫자가 이미 매초 움직여, 아이콘까지 흔들면 시선이 둘로 갈린다.
 * 시계가 그려질 때만 함께 그린다(BalanceClock의 below). 낭독기에는 숨긴다(시계가 이미 "남은 시간 …"으로 읽힌다).
 */
function BoardClockLabel({ closed }: { closed: boolean }) {
  const palette = BOARD_PALETTE;

  return (
    <span
      aria-hidden
      className={cn(
        "mt-1.5 inline-flex h-6 items-center gap-1 rounded-full pr-2.5 pl-2 text-label-m tracking-[0.5px]",
        palette.row,
        palette.muted,
      )}
    >
      <TimerIcon size={14} className="text-interactive-primary" />
      {closed ? "투표 종료" : "남은 시간"}
    </span>
  );
}
