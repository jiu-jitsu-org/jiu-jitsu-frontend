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
 *
 * 잔여 시간은 하드코딩 문구가 아니라 실제 카운트다운이 돈다. 훅이 endAt과 serverTime의 **차이**만
 * 쓰기 때문에(기기 시계와 무관) 과거 날짜를 넣어도 그 차이만큼 정확히 흐른다.
 */
const SERVER_TIME = "2026-09-01T00:00:00";

/** serverTime 기준 오프셋으로 만든 마감 시각 — 그 차이가 곧 시작 잔여 시간이 된다. */
function endAtAfter({
  hours = 0,
  minutes = 0,
  seconds = 0,
}: {
  hours?: number;
  minutes?: number;
  seconds?: number;
}): string {
  const base = new Date(`${SERVER_TIME}Z`);
  base.setUTCHours(base.getUTCHours() + hours);
  base.setUTCMinutes(base.getUTCMinutes() + minutes);
  base.setUTCSeconds(base.getUTCSeconds() + seconds);

  // serverTime과 같은 표기(타임존 없음)로 맞춘다 — 두 값을 같은 규칙으로 파싱해야 차이가 맞다.
  return base.toISOString().replace("Z", "").replace(/\.\d{3}$/, "");
}

const BASE_GAME: BalanceGame = {
  contentId: 1,
  endAt: endAtAfter({ hours: 20, minutes: 15, seconds: 46 }),
  serverTime: SERVER_TIME,
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

const CASES: { label: string; game: BalanceGame }[] = [
  {
    label: "① 투표 전 (댓글 있음) — 20시간대, 매초 흐름",
    game: BASE_GAME,
  },
  {
    label: "② 투표 전 (댓글 0) — '첫 댓글 남기러 가기'",
    game: { ...BASE_GAME, commentCount: 0 },
  },
  {
    label: "③ A 투표함 — 시 단위 없이 '42분 08초 남음'",
    game: {
      ...BASE_GAME,
      myVote: "A",
      endAt: endAtAfter({ minutes: 42, seconds: 8 }),
    },
  },
  {
    label: "④ B 투표함",
    game: {
      ...BASE_GAME,
      myVote: "B",
      endAt: endAtAfter({ minutes: 42, seconds: 8 }),
    },
  },
  {
    label: "⑤ 1분 미만 — '곧 종료돼요'",
    game: { ...BASE_GAME, endAt: endAtAfter({ seconds: 30 }) },
  },
  {
    label: "⑥ 5초 뒤 만료 — 0 도달 시 onExpired 1회",
    game: { ...BASE_GAME, endAt: endAtAfter({ seconds: 5 }) },
  },
];

export default function BalancePreviewPage() {
  const [showSticky, setShowSticky] = useState(false);
  const [expiredLog, setExpiredLog] = useState<string[]>([]);

  return (
    <main className="min-h-screen bg-[var(--bw-white)] pb-24">
      {showSticky ? (
        <BalanceStickyBar
          endAt={BASE_GAME.endAt}
          serverTime={BASE_GAME.serverTime}
          onPress={() => alert("sticky → 상세 이동")}
        />
      ) : null}

      <div className="flex flex-col gap-2 px-4 pt-6 pb-4">
        <button
          type="button"
          onClick={() => setShowSticky((prev) => !prev)}
          className="self-start rounded-lg border border-border-default px-3 py-2 text-body-s"
        >
          sticky 바 {showSticky ? "숨기기" : "보기"}
        </button>

        {expiredLog.length > 0 ? (
          <p className="text-label-m text-text-tertiary">
            onExpired 호출: {expiredLog.join(", ")}
          </p>
        ) : null}
      </div>

      {CASES.map((testCase) => (
        <section key={testCase.label} className="mb-6">
          <p className="px-4 pb-2 text-label-m text-text-tertiary">
            {testCase.label}
          </p>
          <BalanceGameCard
            game={testCase.game}
            onVote={(option) => alert(`투표: ${option}`)}
            onPressDetail={() => alert("상세 이동")}
            onExpired={() =>
              setExpiredLog((prev) => [
                ...prev,
                `${testCase.label.slice(0, 2)} @ ${new Date().toLocaleTimeString()}`,
              ])
            }
          />
        </section>
      ))}
    </main>
  );
}
