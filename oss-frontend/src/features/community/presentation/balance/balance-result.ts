import type {
  BalanceGame,
  BalanceOptionKey,
} from "@/features/community/domain/balance-game";

/**
 * 밸런스 게임 결과 표기 규칙 — 상세 전용.
 *
 * 리스트는 투표율도 진행률 바도 그리지 않는다(카드 높이 불변 제약). 그래서 이 모듈은
 * 상세에서만 쓰이지만, 순수 함수로 떼어 둔다 — 반올림 규칙과 노출 조건은 화면이 아니라
 * 정책이고, 뷰 안에 있으면 두 곳(선택지 A·B)이 각자 계산하게 된다.
 */

/** 한 선택지의 결과 표기. null이면 결과를 그리지 않는다(투표 전). */
export type BalanceOptionResult = {
  /** 정수 투표율(%). 두 선택지의 합은 항상 100이다(무투표 제외). */
  percent: number;
  /**
   * 내가 고른 쪽으로 강조할지(진한 배경 + 흰 글자).
   *
   * **마감되면 양쪽 다 false다** — 정책상 마감 후에는 내 선택에 색상 강조를 주지 않는다.
   * 캐릭터 아트워크는 그대로 두므로 "무엇을 골랐는지"는 여전히 읽을 수 있다.
   */
  emphasized: boolean;
};

/**
 * 두 선택지의 투표율.
 *
 * B를 따로 반올림하지 않고 100에서 빼는 이유: 각자 반올림하면 49.5 / 50.5가 50 / 51이 되어
 * 합이 101이 된다. 화면에 둘이 나란히 붙어 있어 합이 100이 아니면 바로 눈에 띈다.
 *
 * 아무도 투표하지 않았으면 둘 다 0이다. 이때는 합이 100이 아니지만, 50 / 50으로 채우면
 * "반반으로 갈렸다"는 없는 사실을 만들어내므로 0을 그대로 둔다.
 */
export function readVotePercents(game: BalanceGame): Record<
  BalanceOptionKey,
  number
> {
  if (game.totalVoteCount <= 0) {
    return { A: 0, B: 0 };
  }

  const percentA = Math.round(
    (game.optionA.voteCount / game.totalVoteCount) * 100,
  );

  return { A: percentA, B: 100 - percentA };
}

/**
 * 이 선택지에 결과를 표기할지, 표기한다면 어떤 모습인지.
 *
 * 노출 조건은 두 갈래다(정책):
 * - 투표했으면 → 양쪽 다 표기, 내가 고른 쪽만 강조
 * - 마감됐으면 → 투표 여부와 무관하게 양쪽 다 표기, **강조 없음**
 *
 * 둘 다 아니면(투표 전 · 진행 중) null이다 — 투표 전에는 투표율을 감춘다.
 */
export function readOptionResult(
  game: BalanceGame,
  option: BalanceOptionKey,
): BalanceOptionResult | null {
  const voted = game.myVote !== null;

  if (!voted && !game.closed) return null;

  return {
    percent: readVotePercents(game)[option],
    emphasized: !game.closed && game.myVote === option,
  };
}
