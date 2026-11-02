import { isDevelopmentRuntime } from "@/config/env";

/**
 * 홈 피드 맨 위 밸런스 게임 영역의 배치(#305).
 *
 * - before: 바꾸기 전 — 피드 배경 위 카드, 지나가면 미투표일 때만 sticky 바
 * - hero-card (1-A): 위쪽 물든 배경 위에 흰 카드를 띄우고, 배경은 피드로 녹아든다
 * - hero-sheet (2-A): 게임이 히어로 배경이 되고 피드는 손잡이 달린 시트로 겹쳐 올라온다.
 *   시트가 맨 위에 닿으면 시트 머리에 게임 요약이 남는다
 * - hero-bar (2-B): 게임이 히어로 배경, 지나가면 얇은 고정 바로 접힌다
 *
 * 2-A·2-B의 접힌 머리는 투표 여부와 상관없이 늘 보인다 — 화면 구조의 일부라서다.
 * 1-A·before의 sticky 바는 "아직 안 한 게임으로 부르는" 장치라 미투표일 때만 뜬다.
 */
export type BalanceLayout = "before" | "hero-card" | "hero-sheet" | "hero-bar";

/**
 * 기본 배치 — 2-B.
 *
 * 앱바(피드/카테고리)가 이미 위를 차지하고 있어 늘 붙어 있는 머리는 얇을수록 좋다. 2-A의 접힌 머리는
 * 높고(약 86), 끌 수 없는 손잡이가 끌 수 있다고 말하는 것도 걸린다.
 */
export const DEFAULT_BALANCE_LAYOUT: BalanceLayout = "hero-bar";

const LAYOUT_BY_PARAM: Record<string, BalanceLayout> = {
  before: "before",
  "1a": "hero-card",
  "2a": "hero-sheet",
  "2b": "hero-bar",
};

/**
 * (dev 전용) `/?balance=before|1a|2a|2b`로 배치를 바꿔 본다. production에선 늘 기본 배치다.
 * 하나로 정해지면 이 스위치와 쓰지 않는 배치를 지운다.
 */
export function readBalanceLayout(
  value: string | string[] | undefined,
): BalanceLayout {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !isDevelopmentRuntime()) return DEFAULT_BALANCE_LAYOUT;
  return LAYOUT_BY_PARAM[raw] ?? DEFAULT_BALANCE_LAYOUT;
}
