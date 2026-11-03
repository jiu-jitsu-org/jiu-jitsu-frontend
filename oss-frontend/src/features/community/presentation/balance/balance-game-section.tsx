"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useOnLogin } from "@/features/auth/presentation/auth-provider";
import {
  BalanceCollapsedBar,
  COLLAPSED_BAR_OUT_MS,
} from "@/features/community/presentation/balance/balance-collapsed-bar";
import { BalanceHeroBoard } from "@/features/community/presentation/balance/balance-hero-board";
import { useBalanceVote } from "@/features/community/presentation/balance/use-balance-vote";
import { useOpenBalanceDetail } from "@/features/community/presentation/balance/use-open-balance-detail";
import { useStickyReveal } from "@/features/community/presentation/balance/use-sticky-reveal";
import { prefersReducedMotion } from "@/features/community/presentation/use-presence-motion";
import type { BalanceGame } from "@/features/community/domain/balance-game";
import { bffFetch } from "@/shared/lib/http/bff-fetch";

/**
 * 피드 최상단 밸런스 게임 영역 — 상태를 소유한다.
 *
 * 초기값은 Server Component가 조회해 seed로 넘기고(레이아웃 점프 없음), 이후 갱신은
 * 클라이언트가 BFF로 다시 읽는다. 재조회가 필요한 순간은 두 가지다:
 *
 * 1. 잔여 시간이 0에 닿음 → 서버가 다음 판으로 교체했을 것이다
 * 2. 화면이 다시 보임(포그라운드 복귀 · 상세에서 복귀) → 서버 시각 재동기화 겸 최신 상태 확보
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

  const reload = useCallback(async () => {
    if (reloadingRef.current) return;
    reloadingRef.current = true;

    try {
      const response = await bffFetch("/api/community/balance-game");
      if (!response.ok) return;

      const body = (await response.json().catch(() => null)) as
        | { data?: BalanceGame | null }
        | null;

      // data가 없으면(진행 중인 판 없음) 카드를 걷는다.
      setGame(body?.data ?? null);
    } catch {
      // 네트워크 실패는 조용히 넘긴다 — 지금 있는 판을 지우는 것보다 옛 값이 낫다.
    } finally {
      reloadingRef.current = false;
    }
  }, []);

  useOnLogin(() => void reload());

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") void reload();
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
      onExpired={reload}
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
