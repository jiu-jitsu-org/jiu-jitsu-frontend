"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useOnLogin } from "@/features/auth/presentation/auth-provider";
import {
  BalanceCollapsedBar,
  COLLAPSED_BAR_OUT_MS,
} from "@/features/community/presentation/balance/balance-collapsed-bar";
import {
  readBalanceClock,
  readRemainingAtResponse,
} from "@/features/community/presentation/balance/balance-countdown";
import { BalanceHeroBoard } from "@/features/community/presentation/balance/balance-hero-board";
import { balanceVotedSince } from "@/features/community/presentation/balance/balance-voted-at";
import { useBalanceVote } from "@/features/community/presentation/balance/use-balance-vote";
import { useOpenBalanceDetail } from "@/features/community/presentation/balance/use-open-balance-detail";
import { useStickyReveal } from "@/features/community/presentation/balance/use-sticky-reveal";
import { prefersReducedMotion } from "@/features/community/presentation/use-presence-motion";
import type { BalanceGame } from "@/features/community/domain/balance-game";
import { bffFetch } from "@/shared/lib/http/bff-fetch";

/** 시계가 0에 닿은 뒤 넘어가지 못했을 때 다시 읽는 간격과 횟수(#427). */
const EXPIRY_RETRY_MS = 5_000;
const EXPIRY_RETRY_LIMIT = 3;

/**
 * 결과를 보여 주는 판인데 다음 게임 시각이 이미 지났는지 — 서버가 아직 다음 판을 주지 못한 것이라 잠시 뒤 다시 읽는다.
 *
 * 결과 시각(resultUntil) 없이 마감된 판은 기다릴 다음 전환이 없다(옛 응답 · 다음 게임 없음). 다시 읽어도 같은 판이라
 * 넘어간 것으로 친다 — 아니면 그런 판을 받을 때마다 헛조회를 몇 번씩 한다.
 */
function isStuckAtZero(game: BalanceGame): boolean {
  const clock = readBalanceClock(game);
  return (
    clock.phase === "result" &&
    readRemainingAtResponse(clock.until, game.serverTime) === 0
  );
}

/**
 * 숨김으로 그려진 페이지가 이 시간 안에 처음 보이면 seed를 그대로 쓴다(#409).
 * 앱은 미리 불러 둔 홈을 15초 안에 이어받지 못하면 버리므로 그보다 넉넉히 잡는다.
 */
const FRESH_SEED_MS = 30_000;

/**
 * 피드 최상단 밸런스 게임 영역 — 상태를 소유한다.
 *
 * 초기값은 Server Component가 조회해 seed로 넘기고(레이아웃 점프 없음), 이후 갱신은
 * 클라이언트가 BFF로 다시 읽는다. 재조회가 필요한 순간은 두 가지다:
 *
 * 1. 시계가 0에 닿음 → 마감이면 서버가 방금 끝난 판을 결과로(resultUntil까지), 그 결과 시간이 끝나면
 *    다음 판을 준다(00:00~00:30 교체 버퍼, #427). 시계는 판마다 그다음 전환까지를 센다(readBalanceClock)
 * 2. 화면이 다시 보임(포그라운드 복귀 · 상세에서 복귀) → 서버 시각 재동기화 겸 최신 상태 확보
 *    단, 숨김으로 그려진 페이지가 곧바로 처음 보이는 순간은 복귀가 아니라 건너뛴다(앱 미리 불러오기, #409)
 * 3. 비로그인 → 로그인 전환 → 비로그인으로 읽은 내 투표(myVote)를 실제 값으로(#173)
 *
 * 재조회 결과가 null이면 카드를 걷는다 — 진행 중인 판이 없다는 뜻이다. 별도 재시도 루프는 두지
 * 않는다. 다음 복귀 때 어차피 다시 읽고, 실패한 조회를 계속 두드려봐야 화면에 보여줄 것이 없다.
 *
 * 조회 실패도 같은 취급(카드 미노출)이다 — 정책상 에러 UI가 없다.
 */
export function BalanceGameSection({
  initialGame,
  intro = false,
}: {
  initialGame: BalanceGame;
  /** 그날 게임을 처음 볼 때 히어로 인트로를 돌린다(#305 — balance-intro). */
  intro?: boolean;
}) {
  const [game, setGame] = useState<BalanceGame | null>(initialGame);

  // SSR이 다시 돌아 새 seed가 내려오면(세션 복구 후 router.refresh 등) 그 값으로 갈아탄다.
  // 클라이언트 인스턴스는 살아 있어 state가 알아서 바뀌지 않는다.
  const [seededGame, setSeededGame] = useState(initialGame);
  if (seededGame !== initialGame) {
    setSeededGame(initialGame);
    setGame(initialGame);
  }

  // 재조회 중복 방지. 만료와 복귀가 같은 순간에 겹칠 수 있다.
  const reloadingRef = useRef(false);
  // 시계가 0에 닿은 뒤 다시 읽는 중인지(아래 reloadAfterExpiry) — 겹쳐 걸지 않는다.
  const retryingRef = useRef(false);
  const retryTimerRef = useRef<number | null>(null);
  const unmountedRef = useRef(false);

  /** 다시 읽어 판을 갈아끼운다. 넘어갈 판을 받았는지(조회 실패·0에 멈춘 판이면 false)를 돌려준다. */
  const reload = useCallback(async (): Promise<boolean> => {
    // 이미 읽는 중이면 그 결과를 모른다 — 넘어갔다고 치지 않아야 0에 닿은 뒤의 재시도가 일찍 끝나지 않는다.
    if (reloadingRef.current) return false;
    reloadingRef.current = true;

    try {
      const response = await bffFetch("/api/community/balance-game");
      if (!response.ok) return false;

      const body = (await response.json().catch(() => null)) as
        | { data?: BalanceGame | null }
        | null;

      // data가 없으면(진행 중인 판 없음) 카드를 걷는다.
      const next = body?.data ?? null;
      setGame(next);
      return next === null || !isStuckAtZero(next);
    } catch {
      // 네트워크 실패는 조용히 넘긴다 — 지금 있는 판을 지우는 것보다 옛 값이 낫다.
      return false;
    } finally {
      reloadingRef.current = false;
    }
  }, []);

  /**
   * 시계가 0에 닿았을 때(#427) — 다시 읽고, 못 넘어갔으면 잠시 뒤 몇 번만 더 읽는다.
   *
   * 0에 멈춘 시계는 다시 세지 않아 그대로 두면 다음 복귀 때까지 00:00:00에 서 있다. 교체 시각(00:30)에 한 번
   * 조회가 실패하거나 서버가 아직 끝난 판을 주면 그렇게 된다. 횟수를 묶는 이유는 서버가 계속 같은 판을 주는
   * 경우까지 두드리지 않기 위해서다.
   */
  const reloadAfterExpiry = useCallback(() => {
    if (retryingRef.current) return;
    retryingRef.current = true;

    void (async () => {
      try {
        for (let attempt = 0; attempt <= EXPIRY_RETRY_LIMIT; attempt += 1) {
          if (attempt > 0) {
            await new Promise<void>((resolve) => {
              retryTimerRef.current = window.setTimeout(resolve, EXPIRY_RETRY_MS);
            });
            retryTimerRef.current = null;
            if (unmountedRef.current) return;
          }
          if (await reload()) return;
        }
      } finally {
        retryingRef.current = false;
      }
    })();
  }, [reload]);

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      if (retryTimerRef.current !== null) window.clearTimeout(retryTimerRef.current);
    };
  }, []);

  useOnLogin(() => void reload());

  useEffect(() => {
    // 앱은 스플래시 동안 홈 피드를 숨김 상태로 미리 불러 두고, 홈에 붙이는 순간 보이게 한다(#409).
    // 그 첫 visible은 복귀가 아니다 — seed는 방금 서버가 그린 값이라 다시 읽지 않는다.
    // 숨김으로 오래 머물다 처음 보인 경우(웹 백그라운드 탭, 스플래시 중 앱 내림)는 seed가 낡았을 수 있어 읽는다.
    // 보이기 전에 상세가 덮어 그 안에서 투표하고 돌아온 경우(공유 링크·푸시로 실행)도 읽는다.
    const mountedAt = Date.now();
    let seenVisible = document.visibilityState === "visible";

    function handleVisibility() {
      if (document.visibilityState !== "visible") return;
      if (!seenVisible) {
        seenVisible = true;
        const fresh = Date.now() - mountedAt < FRESH_SEED_MS;
        if (fresh && !balanceVotedSince(mountedAt)) return;
      }
      void reload();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [reload]);

  if (!game) return null;

  return (
    <BalanceGameBody
      game={game}
      intro={intro}
      onChange={setGame}
      onExpired={reloadAfterExpiry}
    />
  );
}

/**
 * 접힌 바를 누르면 맨 위로 올라가 게임을 다시 펼친다. 메인 피드는 문서가 스크롤된다.
 * 움직임 줄이기 설정이면 미끄러지지 않고 바로 옮긴다.
 */
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
}

/**
 * 히어로 본체 — 게임이 있을 때만 마운트된다.
 *
 * 투표 훅이 game을 non-null로 받도록 한 겹 나눈다. 섹션에서 바로 부르면 게임이 없을 때도
 * 훅이 돌아야 해서(훅은 조건부 호출 불가) game 전체가 옵셔널로 오염된다.
 *
 * 홈 맨 위는 매트 스코어보드 히어로(#305)다. 히어로가 화면 위로 지나가면 전광판을 얇게 썬 접힌 바가
 * 늘 남는다 — 투표 여부와 상관없는 화면 구조의 일부라, 바를 누르면 맨 위로 올라가 판을 다시 펼친다.
 */
function BalanceGameBody({
  game,
  intro,
  onChange,
  onExpired,
}: {
  game: BalanceGame;
  intro: boolean;
  onChange: (next: BalanceGame) => void;
  onExpired: () => void;
}) {
  const vote = useBalanceVote({ game, onVoted: onChange });
  const openDetail = useOpenBalanceDetail();
  const { targetRef, passed } = useStickyReveal<HTMLDivElement>();

  // 바는 보일 조건이 꺼져도 바로 빼지 않고 걷히는 동안 남겨 둔다.
  // animationend 대신 타이머인 이유는 useLeavingKeys와 같다 — 끝 이벤트를 못 받으면 영영 남는다.
  // 걷히는 도중 다시 보일 조건이 되면 타이머가 취소되고 바는 그대로 다시 내려온다.
  const [barMounted, setBarMounted] = useState(passed);
  if (passed && !barMounted) setBarMounted(true);
  const barLeaving = barMounted && !passed;

  useEffect(() => {
    if (!barLeaving) return;
    // 움직임 줄이기 설정이면 기다리지 않는다(다음 틱에 바로 뺀다).
    const delay = prefersReducedMotion() ? 0 : COLLAPSED_BAR_OUT_MS;
    const timer = window.setTimeout(() => setBarMounted(false), delay);
    return () => window.clearTimeout(timer);
  }, [barLeaving]);

  return (
    <>
      {/* 히어로가 피드와의 사이를 스스로 끝맺는다(아래 모서리만 둥근 판). */}
      <div ref={targetRef}>
        <BalanceHeroBoard
          game={game}
          onVote={vote}
          onPressDetail={() => openDetail(game.contentId)}
          onExpired={onExpired}
          intro={intro}
        />
      </div>
      {barMounted ? (
        <BalanceCollapsedBar
          game={game}
          leaving={barLeaving}
          onPress={scrollToTop}
        />
      ) : null}
    </>
  );
}
