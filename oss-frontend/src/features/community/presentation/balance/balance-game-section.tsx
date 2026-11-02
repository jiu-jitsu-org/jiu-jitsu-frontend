"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useOnLogin } from "@/features/auth/presentation/auth-provider";
import {
  BalanceCollapsedBar,
  COLLAPSED_BAR_OUT_MS,
} from "@/features/community/presentation/balance/balance-collapsed-bar";
import { BalanceGameCard } from "@/features/community/presentation/balance/balance-game-card";
import { BalanceHeroWash } from "@/features/community/presentation/balance/balance-hero-wash";
import type { BalanceLayout } from "@/features/community/presentation/balance/balance-layout";
import {
  BalanceStickyBar,
  STICKY_LIFT_OUT_MS,
} from "@/features/community/presentation/balance/balance-sticky-bar";
import { useBalanceVote } from "@/features/community/presentation/balance/use-balance-vote";
import { useOpenBalanceDetail } from "@/features/community/presentation/balance/use-open-balance-detail";
import { useStickyReveal } from "@/features/community/presentation/balance/use-sticky-reveal";
import { prefersReducedMotion } from "@/features/community/presentation/use-presence-motion";
import type { BalanceGame } from "@/features/community/domain/balance-game";
import { cn } from "@/shared/lib/cn";
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
  layout = "before",
}: {
  initialGame: BalanceGame;
  /** 영역 배치(#305) — balance-layout 참조. */
  layout?: BalanceLayout;
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
      layout={layout}
      onChange={setGame}
      onExpired={reload}
    />
  );
}

/** 배치마다 히어로가 지나간 뒤 남는 접힌 머리 — 없으면(null) 미투표일 때만 sticky 바가 뜬다. */
const COLLAPSED_KIND: Record<BalanceLayout, "sheet" | "bar" | null> = {
  before: null,
  "hero-card": null,
  "hero-sheet": "sheet",
  "hero-bar": "bar",
};

/**
 * 접힌 머리를 누르면 맨 위로 올라가 게임을 다시 펼친다. 메인 피드는 문서가 스크롤된다.
 * 움직임 줄이기 설정이면 미끄러지지 않고 바로 옮긴다.
 */
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
}

/**
 * 카드 본체 — 게임이 있을 때만 마운트된다.
 *
 * 투표 훅이 game을 non-null로 받도록 한 겹 나눈다. 섹션에서 바로 부르면 게임이 없을 때도
 * 훅이 돌아야 해서(훅은 조건부 호출 불가) game 전체가 옵셔널로 오염된다.
 */
function BalanceGameBody({
  game,
  layout,
  onChange,
  onExpired,
}: {
  game: BalanceGame;
  layout: BalanceLayout;
  onChange: (next: BalanceGame) => void;
  onExpired: () => void;
}) {
  const vote = useBalanceVote({ game, onVoted: onChange });
  const openDetail = useOpenBalanceDetail();

  // 2-A·2-B는 히어로가 지나가면 접힌 머리가 늘 남는다(화면 구조의 일부 — balance-layout 참조).
  // 그 밖의 배치에서 sticky 바는 아직 투표하지 않은 사용자에게만 보인다(비로그인 포함 — 그쪽은 계속
  // 미투표다). 투표를 마치면 다시 부를 이유가 없으므로 관찰 자체를 끈다. 취소로 미참여에 돌아오면
  // 관찰이 다시 걸려 카드를 지나칠 때 sticky가 또 뜬다.
  const collapsedKind = COLLAPSED_KIND[layout];
  const canReveal = collapsedKind !== null || game.myVote === null;
  const { targetRef, passed } = useStickyReveal<HTMLDivElement>({
    enabled: canReveal,
  });

  // 바는 보일 조건이 꺼져도 바로 빼지 않고 걷히는 동안 남겨 둔다.
  // animationend 대신 타이머인 이유는 useLeavingKeys와 같다 — 끝 이벤트를 못 받으면 영영 남는다.
  // 걷히는 도중 다시 보일 조건이 되면 타이머가 취소되고 바는 그대로 다시 내려온다.
  const showSticky = canReveal && passed;
  const [stickyMounted, setStickyMounted] = useState(showSticky);
  if (showSticky && !stickyMounted) setStickyMounted(true);
  const stickyLeaving = stickyMounted && !showSticky;
  const leaveMs = collapsedKind ? COLLAPSED_BAR_OUT_MS : STICKY_LIFT_OUT_MS;

  useEffect(() => {
    if (!stickyLeaving) return;
    // 움직임 줄이기 설정이면 기다리지 않는다(다음 틱에 바로 뺀다).
    const delay = prefersReducedMotion() ? 0 : leaveMs;
    const timer = window.setTimeout(() => setStickyMounted(false), delay);
    return () => window.clearTimeout(timer);
  }, [stickyLeaving, leaveMs]);

  const card = (surface: "on-hero" | "raised") => (
    <BalanceGameCard
      game={game}
      surface={surface}
      onVote={vote}
      onPressDetail={() => openDetail(game.contentId)}
      onExpired={onExpired}
    />
  );
  const wash = (fade: "end" | "none") => (
    <BalanceHeroWash
      myVote={game.myVote}
      idle={game.myVote === null && !game.closed}
      fade={fade}
      base
      className="inset-y-0"
    />
  );

  if (layout === "hero-card") {
    return (
      <>
        {/* 1-A: 물든 배경이 카드 둘레(위 16 · 좌우 12)로 비치다가 카드 아래에서 피드로 녹아든다. */}
        <div ref={targetRef} className="relative isolate pt-4 pb-6">
          {wash("end")}
          {card("raised")}
        </div>
        {stickyMounted ? (
          <BalanceStickyBar
            endAt={game.endAt}
            serverTime={game.serverTime}
            onPress={() => openDetail(game.contentId)}
            leaving={stickyLeaving}
          />
        ) : null}
      </>
    );
  }

  if (collapsedKind) {
    return (
      <>
        {/*
          2-A: 아래 20은 피드 시트가 덮는다(BalanceFeedFrame -mt-5) — 그만큼 더 비워 두고, 물들임도
          녹이지 않는다(시트가 경계를 만든다). 관찰은 히어로 끝이 아니라 시트 윗변에 건다 — 시트가
          화면 맨 위에 닿는 바로 그 순간 머리가 생겨야 시트가 머리를 얻은 것처럼 읽힌다.
          2-B: 물들임이 끝에서 피드로 녹는다. 히어로가 완전히 지나가면 접힌다.
        */}
        <div
          ref={collapsedKind === "sheet" ? undefined : targetRef}
          className={cn(
            "relative isolate pt-5",
            collapsedKind === "sheet" ? "pb-8" : "pb-5",
          )}
        >
          {wash(collapsedKind === "sheet" ? "none" : "end")}
          {card("on-hero")}
          {collapsedKind === "sheet" ? (
            <div
              ref={targetRef}
              aria-hidden
              className="absolute inset-x-0 bottom-5 h-px"
            />
          ) : null}
        </div>
        {stickyMounted ? (
          <BalanceCollapsedBar
            kind={collapsedKind}
            game={game}
            leaving={stickyLeaving}
            onPress={scrollToTop}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      {/* 카드 위 38 · 아래 32(카드 눌림 여백 12씩 포함). 구분선 없이 여백으로 나눈다 — 첫 글까지 56
          (+ 피드 목록 24)이 글 사이(40)보다 넓어 구역 경계로 읽힌다. */}
      <div ref={targetRef} className="pt-6.5 pb-5">
        <BalanceGameCard
          game={game}
          onVote={vote}
          onPressDetail={() => openDetail(game.contentId)}
          onExpired={onExpired}
        />
      </div>

      {/*
        카드가 화면 위로 완전히 지나간 뒤에만 뜬다. 카드가 조금이라도 보이는 동안 띄우면
        같은 내용이 두 번 보이고, 무엇보다 sticky가 카드의 선택지를 가린다.

        만료 통지(onExpired)는 넘기지 않는다 — 카드와 동시에 마운트돼 있어 양쪽이 알리면
        재조회가 두 번 걸린다(BalanceRemaining 주석 참조).
      */}
      {stickyMounted ? (
        <BalanceStickyBar
          endAt={game.endAt}
          serverTime={game.serverTime}
          onPress={() => openDetail(game.contentId)}
          leaving={stickyLeaving}
        />
      ) : null}
    </>
  );
}
