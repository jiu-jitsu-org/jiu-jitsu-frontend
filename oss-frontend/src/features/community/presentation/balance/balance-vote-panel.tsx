"use client";

import { useCallback, useState } from "react";

import type { BalanceGame } from "@/features/community/domain/balance-game";
import {
  readJsonData,
  useBalanceCloseTransition,
} from "@/features/community/presentation/balance/use-balance-close-transition";
import { useBalanceVote } from "@/features/community/presentation/balance/use-balance-vote";
import { BalanceHeroBoard } from "@/features/community/presentation/balance/balance-hero-board";

/** 상세 판은 이미 상세라 "판을 누르면 상세로"가 없다. */
const NOOP = () => {};

/**
 * 상세의 투표 영역 — 타이머와 선택지, 그리고 게임 상태를 소유한다.
 *
 * 상세에서 이 블록만 클라이언트인 이유: 투표하면 화면이 즉시 바뀌어야 하는데(낙관적 반영),
 * 댓글까지 클라이언트로 끌어올릴 이유는 없다. 댓글은 서버 렌더 상태 그대로 두고 이 패널만
 * 상태를 가진다 — 게시글 상세가 액션바만 클라이언트 leaf로 두는 것과 같은 분할이다.
 *
 * 리스트(BalanceGameSection)와 달리 포그라운드 복귀 재조회를 두지 않는다. 상세는 지목한 판에
 * 머물러야 하므로 복귀했다고 다음 판을 끌어오면 안 된다. 재조회는 시계가 0에 닿을 때뿐이다 —
 * 시작 전 판이면 투표가 열린 그 판을, 진행 중이면 마감 전환으로 그 판의 최종 집계를 읽는다.
 * 어느 쪽이든 화면은 그 판에 남는다(다음 판은 토스트 버튼으로만 간다).
 */
export function BalanceVotePanel({
  initialGame,
}: {
  initialGame: BalanceGame;
}) {
  const [game, setGame] = useState(initialGame);

  // SSR이 다시 돌아 새 seed가 내려오면(세션 복구 후 router.refresh 등) 그 값으로 갈아탄다.
  // 클라이언트 인스턴스는 살아 있어 state가 알아서 바뀌지 않는다(BalanceGameSection과 같은 패턴).
  const [seededGame, setSeededGame] = useState(initialGame);
  if (seededGame !== initialGame) {
    setSeededGame(initialGame);
    setGame(initialGame);
  }

  const vote = useBalanceVote({ game, onVoted: setGame });

  /**
   * 마감 전환 — 최종 집계로 갈아끼운다.
   *
   * 재조회에 실패하면(null) 화면에 있는 값을 그대로 두고 closed만 뒤집는다. 투표율이 조금
   * 낡을 뿐, 마감 표시조차 못 하는 것보다는 낫다.
   */
  const handleClosed = useCallback((finalGame: BalanceGame | null) => {
    setGame((previous) => finalGame ?? { ...previous, closed: true });
  }, []);

  const handleExpired = useBalanceCloseTransition({
    contentId: game.contentId,
    onClosed: handleClosed,
  });

  /**
   * 시작 전 판(#427)의 시계가 0에 닿음 — 투표가 열렸으니 그 판을 다시 읽어 갈아끼운다.
   *
   * 다시 읽어도 아직 시작 전이면(기기 시계가 앞서 감) 로컬로 열어 둔다. 시작 시각이 그대로라 시계가 0에 멈춘 채
   * 다시 세지 않으므로, 그대로 두면 판이 영영 닫혀 있다. 그 사이 누르면 서버가 C0011로 막고 투표 훅이 알린다.
   */
  const handleStarted = useCallback(() => {
    void readJsonData<BalanceGame>(
      `/api/community/balance-game/${game.contentId}`,
    ).then((fresh) => {
      setGame((previous) =>
        fresh?.started ? fresh : { ...previous, started: true },
      );
    });
  }, [game.contentId]);

  // 홈과 같은 스코어보드 판(#305). 투표했거나 마감되면 득표율을 줄이 보여 준다(variant="detail").
  return (
    <BalanceHeroBoard
      game={game}
      onVote={vote}
      onPressDetail={NOOP}
      // 이미 마감된 판으로 들어왔으면(지난 게임 · 내 활동 목록) 마감 안내를 띄우지 않는다 —
      // 보는 중에 0에 닿은 경우만 알린다.
      onExpired={
        game.closed ? undefined : game.started ? handleExpired : handleStarted
      }
      variant="detail"
    />
  );
}
