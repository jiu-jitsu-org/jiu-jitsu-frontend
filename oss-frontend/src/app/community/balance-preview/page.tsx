"use client";

import { useState } from "react";

import { BalanceGameCard } from "@/features/community/presentation/balance/balance-game-card";
import { BalanceStickyBar } from "@/features/community/presentation/balance/balance-sticky-bar";
import type { BalanceGame } from "@/features/community/domain/balance-game";

/**
 * [임시] 밸런스 게임 뷰 확인용 프리뷰 (`/community/balance-preview`).
 *
 * 업스트림에 진행 중인 게임이 없어도(현재 dev는 data: null) 카드 상태를 눈으로 확인하려고 둔다.
 * Phase 5에서 실데이터가 붙으면 지운다 — 커밋에 남기지 않는다.
 */
const BASE_GAME: BalanceGame = {
  contentId: 1,
  endAt: "2026-09-02T00:00:00",
  serverTime: "2026-09-01T03:44:14",
  closed: false,
  optionA: {
    key: "A",
    text: "가드 패스 성공률 100%지만 서브 미션 절대 안 됨",
    imageUrl: null,
    voteCount: 7,
  },
  optionB: {
    key: "B",
    text: "서브 미션 성공률 100%지만 가드 패스 절대 못 함",
    imageUrl: null,
    voteCount: 3,
  },
  totalVoteCount: 10,
  myVote: null,
  commentCount: 5,
};

const CASES: { label: string; game: BalanceGame; remaining: string }[] = [
  {
    label: "① 투표 전 (댓글 있음)",
    game: BASE_GAME,
    remaining: "20시간 15분 46초 남음",
  },
  {
    label: "② 투표 전 (댓글 0) — '첫 댓글 남기러 가기'",
    game: { ...BASE_GAME, commentCount: 0 },
    remaining: "20시간 15분 46초 남음",
  },
  {
    label: "③ A 투표함",
    game: { ...BASE_GAME, myVote: "A" },
    remaining: "42분 08초 남음",
  },
  {
    label: "④ B 투표함",
    game: { ...BASE_GAME, myVote: "B" },
    remaining: "42분 08초 남음",
  },
  {
    label: "⑤ 마감 임박 (1분 미만)",
    game: BASE_GAME,
    remaining: "곧 종료돼요",
  },
];

export default function BalancePreviewPage() {
  const [showSticky, setShowSticky] = useState(false);

  return (
    <main className="min-h-screen bg-[var(--bw-white)] pb-24">
      {showSticky ? (
        <BalanceStickyBar
          remainingLabel="8시간 남음"
          onPress={() => alert("sticky → 상세 이동")}
        />
      ) : null}

      <div className="px-4 pt-6 pb-4">
        <button
          type="button"
          onClick={() => setShowSticky((prev) => !prev)}
          className="rounded-lg border border-border-default px-3 py-2 text-body-s"
        >
          sticky 바 {showSticky ? "숨기기" : "보기"}
        </button>
      </div>

      {CASES.map((testCase) => (
        <section key={testCase.label} className="mb-6">
          <p className="px-4 pb-2 text-label-m text-text-tertiary">
            {testCase.label}
          </p>
          <BalanceGameCard
            game={testCase.game}
            remainingLabel={testCase.remaining}
            onVote={(option) => alert(`투표: ${option}`)}
            onPressDetail={() => alert("상세 이동")}
          />
        </section>
      ))}
    </main>
  );
}
