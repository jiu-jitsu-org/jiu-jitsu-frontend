"use client";

import { useState } from "react";

import type {
  BalanceGame,
  BalanceOptionKey,
} from "@/features/community/domain/balance-game";
import {
  BalanceOptionButton,
  type BalanceOptionState,
} from "@/features/community/presentation/balance/balance-option-button";
import { BalanceRemaining } from "@/features/community/presentation/balance/balance-remaining";
import { readOptionResult } from "@/features/community/presentation/balance/balance-result";
import { useOpenBalanceDetail } from "@/features/community/presentation/balance/use-open-balance-detail";
import { FeedCardCommentCount } from "@/features/community/presentation/feed/feed-card";
import { formatGameDate } from "@/features/community/presentation/format-detail-date";
import { cn } from "@/shared/lib/cn";
import { PRESS_BOUNCE } from "@/shared/ui/press-styles";

/**
 * 참여한 밸런스 게임 한 항목 — 항목 전체가 상세로 가는 버튼이다.
 *
 * 구성(위 → 아래):
 * - 날짜 행(Label M · tertiary): 왼쪽 진행일, 오른쪽은 진행 중일 때만 남은 시간(시계 아이콘 primary).
 * - 8 아래 선택지 두 줄(사이 4): 상세의 결과 상태와 **같은 컴포넌트**(BalanceOptionButton)를 표시 전용으로
 *   그린다 — 캐릭터 크기는 내 투표로, 결과 바 · 퍼센트는 readOptionResult가 정한다(진행 중이면 내 쪽만
 *   강조, 마감이면 양쪽 다 일반 색).
 * - 8 아래 오른쪽 댓글 수(피드 카드 리액션 행의 댓글 모양, 표시 전용).
 *
 * 버튼 안에 버튼을 둘 수 없어 선택지 · 댓글 수는 displayOnly(span)로 그린다.
 */
export function MyBalanceGameItem({ game }: { game: BalanceGame }) {
  const openBalanceDetail = useOpenBalanceDetail();

  // 보는 중에 마감 시각이 지나면 그 자리에서 마감 모양(남은 시간 숨김 · 강조 해제)으로 바꾼다.
  // 최종 집계는 다시 읽지 않는다 — 상세에 들어가면 최신 결과를 본다.
  const [expired, setExpired] = useState(false);
  const shown = expired && !game.closed ? { ...game, closed: true } : game;

  // 상세(BalanceVotePanel)와 같은 규칙 — 마감 여부와 무관하게 캐릭터는 내가 고른 그대로다.
  const optionState = (option: BalanceOptionKey): BalanceOptionState => {
    if (shown.myVote === null) return "default";
    return shown.myVote === option ? "selected" : "unselected";
  };

  return (
    <button
      type="button"
      onClick={() => openBalanceDetail(game.contentId)}
      className={cn("flex w-full flex-col text-left", PRESS_BOUNCE)}
    >
      <span className="flex w-full items-center justify-between gap-2 text-label-m text-text-tertiary">
        <span>{shown.gameDate ? formatGameDate(shown.gameDate) : null}</span>
        {shown.closed ? null : (
          <BalanceRemaining
            endAt={shown.endAt}
            serverTime={shown.serverTime}
            onExpired={() => setExpired(true)}
            showIcon
          />
        )}
      </span>

      {/* 날짜 행 아래 8, 선택지 사이 4 */}
      <span className="mt-2 flex w-full flex-col gap-1">
        <BalanceOptionButton
          option={shown.optionA}
          state={optionState("A")}
          interactive={false}
          result={readOptionResult(shown, "A")}
          displayOnly
        />
        <BalanceOptionButton
          option={shown.optionB}
          state={optionState("B")}
          interactive={false}
          result={readOptionResult(shown, "B")}
          displayOnly
        />
      </span>

      {/* 선택지 아래 8, 오른쪽 정렬 */}
      <span className="mt-2 flex w-full justify-end">
        <FeedCardCommentCount
          count={shown.commentCount}
          commented={shown.commented}
        />
      </span>
    </button>
  );
}
