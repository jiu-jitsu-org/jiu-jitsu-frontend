"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { BalanceGameCard } from "@/features/community/presentation/balance/balance-game-card";
import { BalanceStickyBar } from "@/features/community/presentation/balance/balance-sticky-bar";
import { useBalanceVote } from "@/features/community/presentation/balance/use-balance-vote";
import { useOpenBalanceDetail } from "@/features/community/presentation/balance/use-open-balance-detail";
import { useStickyReveal } from "@/features/community/presentation/balance/use-sticky-reveal";
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
 *
 * 재조회 결과가 null이면 카드를 걷는다 — 진행 중인 판이 없다는 뜻이다. 별도 재시도 루프는 두지
 * 않는다. 다음 복귀 때 어차피 다시 읽고, 실패한 조회를 계속 두드려봐야 화면에 보여줄 것이 없다.
 *
 * 조회 실패도 같은 취급(카드 미노출)이다 — 정책상 에러 UI가 없다.
 */
export function BalanceGameSection({
  initialGame,
}: {
  initialGame: BalanceGame;
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

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") void reload();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [reload]);

  if (!game) return null;

  return <BalanceGameBody game={game} onChange={setGame} onExpired={reload} />;
}

/**
 * 카드 본체 — 게임이 있을 때만 마운트된다.
 *
 * 투표 훅이 game을 non-null로 받도록 한 겹 나눈다. 섹션에서 바로 부르면 게임이 없을 때도
 * 훅이 돌아야 해서(훅은 조건부 호출 불가) game 전체가 옵셔널로 오염된다.
 */
function BalanceGameBody({
  game,
  onChange,
  onExpired,
}: {
  game: BalanceGame;
  onChange: (next: BalanceGame) => void;
  onExpired: () => void;
}) {
  const vote = useBalanceVote({ game, onVoted: onChange });
  const openDetail = useOpenBalanceDetail();

  // sticky 바는 아직 투표하지 않은 사용자에게만 보인다(비로그인 포함 — 그쪽은 계속 미투표다).
  // 투표를 마치면 다시 부를 이유가 없으므로 관찰 자체를 끈다.
  const canReveal = game.myVote === null;
  const { targetRef, passed } = useStickyReveal<HTMLDivElement>({
    enabled: canReveal,
  });

  return (
    <>
      {/* 카드 위아래 24 + hairline 구분선. 구분선 아래 24는 피드 목록의 pt-6이 만든다. */}
      <div ref={targetRef} className="border-b border-border-subtle pt-6 pb-6">
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
      {canReveal && passed ? (
        <BalanceStickyBar
          endAt={game.endAt}
          serverTime={game.serverTime}
          onPress={() => openDetail(game.contentId)}
        />
      ) : null}
    </>
  );
}
