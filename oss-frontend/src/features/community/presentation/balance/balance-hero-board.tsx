"use client";

import {
  Component,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  BalanceCharacter,
  SETTLE_TIMING,
} from "@/features/community/presentation/balance/balance-character";
import {
  BALANCE_CLOCK_LABEL,
  readBalanceClock,
  type BalanceClockPhase,
} from "@/features/community/presentation/balance/balance-countdown";
import { usePauseMotionWhenHidden } from "@/features/community/presentation/balance/use-pause-motion-when-hidden";
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
 * 홈 판은 화면 끝까지 꽉 찬 바탕 띠다 — 피드가 담긴 흰 판이 둥근 위 모서리로 이 아래쪽을 덮고 올라와
 * 피드가 한 층 위로 읽힌다. 덮이는 20px만큼 아래를 더 비운다(pb-3 → pb-8). 어두운 면은 이 판 하나뿐이다.
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

/**
 * 글자 크기·여백은 바로 바뀐다. 줄 높이는 RowHeightMotion이 따로 이어 주므로, 문구가 커져도 줄이 먼저 튀지 않는다.
 */
const OPTION_TEXT: Record<BalanceOptionState, string> = {
  default: "py-2.5 text-title-3",
  selected: "py-3 text-title-3",
  unselected: "py-2 text-body-m",
};

/**
 * 문구의 줄바꿈 폭 — 진영 블록 폭이 아니라 줄 전체 폭에서 바로 계산한다. 블록이 움직이는 동안 문구 칸 폭이 변해도
 * 줄바꿈은 그대로라, 줄어드는 도중에 끊기는 자리가 바뀌며 튀지 않는다. 128 = 투표 전 블록(100) + 문구 좌우 여백(28).
 * 밀려난 줄의 0.8889는 글자 크기 비율(16/18)이다 — 글자가 작아진 만큼 폭도 줄여 끊기는 자리를 고르기 전과 맞춘다.
 */
const TEXT_WRAP_WIDTH: Record<BalanceOptionState, string> = {
  default: "w-[calc(100cqw-128px-var(--score-w))]",
  selected: "w-[calc(100cqw-128px-var(--score-w))]",
  unselected: "w-[calc((100cqw-128px-var(--score-w))*0.8889)]",
};

/**
 * 줄의 투명도·눌림 전환. 줄 높이는 RowHeightMotion이 맡고, 눌림(scale)은 위치를 밀지 않아 스프링을 유지한다.
 */
const ROW_MOTION =
  "motion-safe:[transition:opacity_300ms_ease,scale_500ms_var(--ease-spring-wobbly)]";

/**
 * 줄 높이 전환 — 넘침 없이 한 번에 자리 잡는다. 두 줄이 위아래로 쌓여 있어, 위 줄이 출렁이면 아래 줄과 피드까지
 * 같이 흔들린다. 튕기는 맛은 레이아웃을 건드리지 않는 캐릭터 보잉이 맡는다.
 *
 * min-height 전환으로는 부족하다. 글자가 커지면 문구 높이가 곧바로 늘어, 2줄 문구의 줄이 첫 프레임에 튄다.
 * 그래서 바뀌기 직전 높이(getSnapshotBeforeUpdate — 이 시점을 잡으려고 클래스로 둔다)에서 새 높이까지 직접 잇는다.
 * 두 줄이 같은 곡선을 타므로 판 전체 높이도 한 방향으로만 변한다. 높이는 눌림(scale) 영향이 없는 계산값으로 읽는다.
 */
class RowHeightMotion extends Component<{
  state: BalanceOptionState;
  rowRef: RefObject<HTMLButtonElement | null>;
  children: ReactNode;
}> {
  private motion: Animation | null = null;

  getSnapshotBeforeUpdate(prev: { state: BalanceOptionState }): string | null {
    const row = this.props.rowRef.current;
    if (!row || prev.state === this.props.state) return null;
    return getComputedStyle(row).height;
  }

  componentDidUpdate(_prev: unknown, _state: unknown, from: string | null) {
    const row = this.props.rowRef.current;
    if (!row || from === null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    this.motion?.cancel();
    const to = getComputedStyle(row).height;
    if (from === to) return;
    this.motion = row.animate(
      [
        { height: from, minHeight: from },
        { height: to, minHeight: to },
      ],
      SETTLE_TIMING,
    );
  }

  render() {
    return this.props.children;
  }
}

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

/** 머리 알약 — 판이 지금 어떤 상태인지. */
const PHASE_BADGE: Record<BalanceClockPhase, string> = {
  upcoming: "시작 전",
  open: "진행 중",
  result: "종료",
  closed: "종료",
};

export function BalanceHeroBoard({
  game,
  onVote,
  onPressDetail,
  onExpired,
  intro = false,
  variant = "hero",
  yesterday = false,
  footer,
}: BalanceHeroProps & {
  /**
   * hero: 홈 맨 위 — 화면 끝까지 꽉 찬 띠(흰 판이 아래를 덮는다), 판 아무 데나 누르면 상세로, 댓글 링크가 붙는다.
   * detail: 상세 맨 위(#305 시안) — 네 모서리가 둥근 판, 투표했거나 마감되면 점수 자리에 득표율이 뜨고
   * 줄 바탕이 그만큼 진영 색으로 찬다. 댓글은 바로 아래 있어 링크를 두지 않는다.
   */
  variant?: "hero" | "detail";
  /**
   * 홈에서 어제 판 결과를 먼저 보여 줄 때(#681) — 제목이 '어제의 밸런스 게임'이 된다. 판은 끝난 판이라
   * 마감된 홈 판(교체 버퍼)과 같이 득표율 · 내 선택이 뜬다.
   */
  yesterday?: boolean;
  /** 판 맨 아래(댓글 링크 밑)에 붙일 것 — 어제 결과의 '오늘의 밸런스 게임 보기' 버튼. */
  footer?: ReactNode;
}) {
  const heading = yesterday ? "어제의 밸런스 게임" : "오늘의 밸런스 게임";
  const detail = variant === "detail";
  // 시작 전 판도 누를 수 없다(#427) — 눌리면 투표 훅이 "아직 시작 전"이라고 알린다.
  const interactive = !game.closed && game.started;
  const clock = readBalanceClock(game);
  // 쉬는 판(시작 전 · 마감)은 점이 꺼지고 물결이 멈춘다.
  const idle = clock.phase === "upcoming" || game.closed;
  // 득표율 — 상세는 투표했거나 마감되면, 홈은 마감된 판(00:00~00:30 교체 버퍼)일 때 보인다(#427).
  // 버퍼 동안 홈은 방금 끝난 판의 결과를 보여 주는 자리라, 투표하지 않은 사람에게도 결과를 연다.
  const showResult = detail || game.closed;
  // 끝난 판 결과(어제 결과 · 끝난 판 상세) — 더 셀 시간이 없어 경기 시계를 걷고, 질문(타이틀)과 내 선택을 앞에 둔다.
  // 교체 버퍼(result)는 다음 게임까지 세는 시계가 있어 그대로 둔다.
  const settled = clock.phase === "closed";
  const palette = BOARD_PALETTE;
  const boardRef = usePauseMotionWhenHidden<HTMLElement>();

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
      ref={boardRef}
      onClick={detail ? undefined : pressOutsideControls(onPressDetail)}
      className={cn(
        "relative flex flex-col overflow-hidden px-4 pt-5",
        // 판이 안 보이면 안의 반복 움직임을 그 자리에 세운다(usePauseMotionWhenHidden).
        "data-[motion-paused]:[&_*]:[animation-play-state:paused]",
        detail
          ? cn("rounded-[24px] pb-5", palette.shadow)
          : "home-band isolate cursor-pointer pb-8",
        palette.bg,
        palette.text,
      )}
      aria-label={heading}
    >
      <header className={cn("flex items-center justify-between px-1", parts.header)}>
        <h2 className={cn(balanceTitleFont.className, "text-[22px] leading-7")}>
          {settled ? (yesterday ? "어제의 밸런스 게임" : "지난 밸런스 게임") : heading}
        </h2>
        {/*
          경기 중 표시 — 중계 화면의 "생중계" 알약. 선수 줄과 같은 옅은 면에 홍 점을 두고, 점 둘레로 물결이
          번진다(동작 줄이기면 멈춘다). 마감되면 점이 회색으로 꺼지고 "종료"로 바뀐다.
        */}
        <span
          className={cn(
            "flex h-7 items-center gap-1.5 rounded-full pr-3 pl-2.5 text-label-m font-semibold",
            palette.row,
            idle && palette.muted,
          )}
        >
          <span aria-hidden className="relative flex size-2">
            {idle ? null : (
              <span className="absolute inset-0 rounded-full bg-interactive-poll-a motion-safe:animate-ping motion-safe:[animation-duration:1.6s]" />
            )}
            <span
              className={cn(
                "relative size-2 rounded-full",
                idle ? "bg-current opacity-60" : "bg-interactive-poll-a",
              )}
            />
          </span>
          {PHASE_BADGE[clock.phase]}
        </span>
      </header>

      {/*
        판 타이틀(#682) — 판이 묻는 말이라 흰 말풍선에 담아 가운데 둔다. 제목('오늘의 밸런스 게임')과 글꼴로 다투지 않고
        모양으로 갈린다. 타이틀이 없는 판은 지금처럼 제목만.
      */}
      {game.title ? (
        <div className={cn("mt-5 flex justify-center px-2", parts.header)}>
          <p className="relative max-w-full rounded-2xl bg-[var(--bw-true-white)] px-5 py-2.5 text-center text-title-2 font-bold text-balance break-keep text-[var(--cool-gray-900)]">
            {game.title}
            <span
              aria-hidden
              className="absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 rounded-[2px] bg-[var(--bw-true-white)]"
            />
          </p>
        </div>
      ) : null}

      {/*
        경기 시계 — 판의 주인공. 숫자가 자리마다 굴러간다. 끝난 판(어제 결과 · 끝난 판 상세)은 더 셀 시간이 없어 걷는다.
        무엇을 세는지('남은 시간')는 시계 밑 작은 회색 글씨로 둔다 — 알약이면 숫자 다음으로 눈에 띄어 판이 무거웠다.
      */}
      {settled ? null : (
        <div className={cn("flex flex-col items-center", game.title ? "mt-5" : "mt-4", parts.clock)}>
          <BalanceClock
            endAt={clock.until}
            serverTime={game.serverTime}
            onExpired={onExpired}
            label={BALANCE_CLOCK_LABEL[clock.phase]}
            // 카니트 엑스트라볼드, 똑바로. 경기 시계가 판의 주인공이다.
            className={cn(
              balanceNumeralFont.className,
              "inline-block text-[60px] leading-[64px] tracking-[-1px]",
            )}
            below={() => <BoardClockCaption phase={clock.phase} />}
          />
        </div>
      )}

      <div className={cn("flex flex-col gap-5", settled && game.title ? "mt-7" : "mt-6")}>
        <BoardRow
          option={game.optionA}
          state={optionStateOf(game, "A")}
          interactive={interactive}
          intro={parts}
          detail={showResult}
          result={showResult ? settledResult(readOptionResult(game, "A"), settled && game.myVote === "A") : null}
          mine={game.closed && game.myVote === "A"}
          onPress={() => onVote("A")}
        />
        <BoardRow
          option={game.optionB}
          state={optionStateOf(game, "B")}
          interactive={interactive}
          intro={parts}
          detail={showResult}
          result={showResult ? settledResult(readOptionResult(game, "B"), settled && game.myVote === "B") : null}
          mine={game.closed && game.myVote === "B"}
          onPress={() => onVote("B")}
        />
      </div>

      {detail ? null : (
        <div className="mt-2 flex justify-end">
          <BalanceHeroCommentLink game={game} onPress={onPressDetail} />
        </div>
      )}

      {footer ? <div className="mt-3">{footer}</div> : null}
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
  mine,
  onPress,
}: {
  option: BalanceGameOption;
  state: BalanceOptionState;
  interactive: boolean;
  intro: IntroParts;
  /** 득표 막대 자리를 늘 깔아 둘지 — 상세 판, 그리고 결과를 보여 주는 마감된 홈 판(아래 득표 막대 참조). */
  detail: boolean;
  /** 득표율(상세, 홈은 마감된 판만) — 있으면 줄이 통째로 켜지는 대신 득표율만큼 진영 색이 차고 점수 자리에 %가 뜬다. */
  result: BalanceOptionResult | null;
  /**
   * 끝난 판에서 내가 고른 쪽인지(#681) — 득표율 위에 '내 선택'을 단다. 마감되면 내 쪽 막대를 진하게 칠하지 않는
   * 정책(readOptionResult)이라 캐릭터 크기만으로는 어느 쪽을 골랐는지 놓치기 쉽다.
   */
  mine: boolean;
  onPress: () => void;
}) {
  const key = option.key;
  const selected = state === "selected";
  const palette = BOARD_PALETTE;
  const rowRef = useRef<HTMLButtonElement>(null);

  // 득표 막대의 진하기 — 마지막으로 받은 득표율의 것을 붙잡아 둔다. 투표를 취소하면 득표율이 사라지며 막대가
  // 0으로 줄어드는데, 그 1초 동안 옅던 쪽이 진하게 번쩍이지 않게 줄어드는 내내 원래 진하기를 지킨다.
  const [emphasized, setEmphasized] = useState(result?.emphasized ?? true);
  if (result && result.emphasized !== emphasized) setEmphasized(result.emphasized);

  // 글자 크기 전환(18 ↔ 16) — 크기는 바로 바뀌므로 이전 크기로 보이게 키웠다가 줄과 같은 시간에 제 크기로 돌아온다.
  // 마운트 때와 글자 크기가 그대로인 전환(투표 전 ↔ 고름)에는 돌지 않는다.
  const [lastState, setLastState] = useState(state);
  const [textMotion, setTextMotion] = useState<string | null>(null);
  if (lastState !== state) {
    setLastState(state);
    if (state === "unselected") setTextMotion("motion-safe:animate-balance-text-shrink");
    else if (lastState === "unselected") setTextMotion("motion-safe:animate-balance-text-grow");
  }

  return (
    <RowHeightMotion state={state} rowRef={rowRef}>
      <button
        ref={rowRef}
        type="button"
        aria-pressed={selected}
        onClick={onPress}
        className={cn(
          // @container: 문구의 줄바꿈 폭(TEXT_WRAP_WIDTH)이 줄 폭을 읽는다.
          "@container relative flex w-full items-stretch rounded-2xl text-left",
          // 점수 칸 폭 — 상세는 득표율이 뜨는 폭을 투표 전에도 잡아 둔다. 고르는 순간 문구 폭이 줄어 다시 끊기지 않게.
          detail ? "[--score-w:64px]" : "[--score-w:40px]",
          ROW_SIZE[state],
          // 바탕은 늘 판 위에 한 단 뜬 면(흰 9%). 고르면 그 위로 진영 색이 왼쪽부터 차오른다(아래 차오름 면).
          palette.row,
          // 득표율을 읽어야 하는 상세에서는 밀려난 줄을 덜 끈다.
          state === "unselected" && (result ? "opacity-75" : "opacity-50"),
          ROW_MOTION,
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
          투표 전에도 0%로 깔아 둔다(#310) — 고르는 순간 새로 그리면 다 찬 채로 툭 나타난다. 0에서 득표율까지
          홈의 차오름과 같은 시간·곡선(1초, 부드럽게 멈춤)으로 차오른다. 출렁이는 곡선은 막대가 득표율을 넘쳤다
          돌아와 띠용 하고 튀어 보여 뺐다.
          폭이 아니라 줄 크기의 면을 밀어 넣는다(#317) — 폭을 바꾸면 차오르는 1초 내내 레이아웃을 다시 계산한다.
          바깥 겹이 줄 모양으로 잘라, 면의 오른쪽 둥근 끝만 줄 안에서 움직인다.
        */}
        {detail ? (
          <span aria-hidden className="absolute inset-0 isolate overflow-hidden rounded-2xl">
            <span
              className={cn(
                "absolute inset-0 rounded-2xl motion-safe:transition-transform motion-safe:duration-1000 motion-safe:ease-smooth-out",
                CORNER[key],
                // 진하게 칠한 쪽과 꽉 찬 줄은 진영 블록과 같은 불투명 색이어야 경계가 안 보인다(#324).
                emphasized || result?.percent === 100 ? "opacity-100" : "opacity-35",
              )}
              style={{ transform: `translateX(${(result?.percent ?? 0) - 100}%)` }}
            />
          </span>
        ) : null}

        {/*
          고른 줄 차오름(홈) — 고르면 진영 블록에서 시작해 줄 끝까지 진영 색이 차올라 줄이 통째로 켜진다
          (전광판에서 승자 줄이 켜지듯). 취소하면 같은 길로 빠진다. 득표율을 그리는 상세는 위 득표 막대가 맡는다.
          상세 득표 막대와 같은 방식으로 줄 크기의 면을 밀어 넣는다(#317) — 둥근 모서리가 찌그러지지 않고 다시 그리지도 않는다.
        */}
        {detail ? null : (
          <span aria-hidden className="absolute inset-0 isolate overflow-hidden rounded-2xl">
            <span
              className={cn(
                "absolute inset-0 rounded-2xl motion-safe:transition-transform motion-safe:duration-1000 motion-safe:ease-smooth-out",
                CORNER[key],
                selected ? "translate-x-0" : "-translate-x-full",
              )}
            />
          </span>
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
            "pointer-events-none relative shrink-0 motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-smooth-out",
            // 너비는 ROW_SIZE의 --corner-w 하나로 정한다 — 인트로 색 판도 같은 값에서 멈춘다.
            "w-[var(--corner-w)]",
          )}
        >
          <span className={cn("absolute inset-0 rounded-l-2xl", CORNER[key], CORNER_CLIP)} />
          <span className={cn("absolute inset-0 flex items-end pl-1", CHARACTER_CLIP)}>
            <span
              className={cn(
                "aspect-[58/66] shrink-0 origin-bottom motion-safe:transition-[height] motion-safe:duration-500 motion-safe:ease-smooth-out",
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
          {/*
            shrink-0: 블록 폭이 변하는 동안 문구 폭이 눌려 다시 끊기지 않는다. 줄 폭 단위(cqw)를 못 읽는
            브라우저에서는 폭 지정이 통째로 무시되므로, 넘치지 않게 칸에 맞춰 줄바꿈하도록 그때만 shrink-0을 뺀다.
          */}
          <span
            className={cn(
              "block min-w-0 origin-left supports-[width:1cqw]:shrink-0",
              TEXT_WRAP_WIDTH[state],
              textMotion,
            )}
          >
            {option.text}
          </span>
          {/* 점수 자리는 낭독기에서 숨겨 두었으므로 득표율은 여기서 읽힌다. */}
          {result ? (
            <span className="sr-only">
              , {result.percent}%{mine ? ", 내 선택" : ""}
            </span>
          ) : null}
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
            "relative flex w-(--score-w) shrink-0 items-center justify-end",
          )}
        >
          <span className={cn("flex items-center justify-center pr-2", result ? "w-16" : "w-10")}>
            <span className={cn("flex flex-col items-center gap-1", intro.letter?.[key])}>
              {/*
                내 선택(#681) — 끝난 판에서 내가 고른 줄의 득표율 위에 흰 채운 칩. 마감 뒤 결과를 보러 온 사람이 가장 먼저
                찾는 것이 '내 쪽이 몇 %였나'라 막대도 내 쪽만 진하게 칠한다(settledResult).
              */}
              {result && mine ? (
                <span className="flex h-5 items-center rounded-full bg-[var(--bw-true-white)] px-2 text-label-m font-semibold whitespace-nowrap text-[var(--cool-gray-900)]">
                  내 선택
                </span>
              ) : null}
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
        </span>
      </button>
    </RowHeightMotion>
  );
}

/**
 * 시계 밑 "남은 시간" 글씨 — 시계가 무엇을 세는지 알려 주는 작은 꼬리말. 알약 · 파란 아이콘을 빼고 판의 옅은 글자색으로
 * 낮춘다(시계 숫자 다음으로 눈에 띄면 판이 무거워진다). 낭독기에는 숨긴다(시계가 이미 "남은 시간 …"으로 읽힌다).
 */
function BoardClockCaption({ phase }: { phase: BalanceClockPhase }) {
  const palette = BOARD_PALETTE;

  return (
    <span
      aria-hidden
      className={cn("mt-1.5 flex items-center gap-1 text-label-m tracking-[0.5px]", palette.muted)}
    >
      <TimerIcon size={12} />
      {BALANCE_CLOCK_LABEL[phase]}
    </span>
  );
}

/**
 * 끝난 판에서는 내가 고른 쪽 막대만 진하게 칠한다(#681) — 결과를 다시 보러 온 사람이 가장 먼저 찾는 것은
 * '내 쪽이 몇 %였나'다. 진행 중 · 교체 버퍼의 규칙(readOptionResult)은 그대로 둔다.
 */
function settledResult(
  result: BalanceOptionResult | null,
  mineInSettled: boolean,
): BalanceOptionResult | null {
  if (!result || !mineInSettled) return result;
  return { ...result, emphasized: true };
}
