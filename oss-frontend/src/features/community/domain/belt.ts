/**
 * 주짓수 띠·그랄 도메인 타입 (#265).
 *
 * 원본은 커뮤니티 프로필(GET /community/profile)의 beltRank·beltStripe다. 커뮤니티 화면은
 * 작성자 사진에 띠 색과 그랄 줄을 함께 그린다. 성인 5띠만 다룬다(키즈 띠는 제외).
 */
export type BeltRank = "white" | "blue" | "purple" | "brown" | "black";

/** 그랄(띠 끝 검은 칸의 줄) 수. 0~4. */
export type BeltGrau = 0 | 1 | 2 | 3 | 4;

export type Belt = {
  rank: BeltRank;
  grau: BeltGrau;
};

/** 띠 순서(화이트 → 블랙). 띠를 고르는 화면이 이 순서로 그린다. */
export const BELT_RANKS: readonly BeltRank[] = [
  "white",
  "blue",
  "purple",
  "brown",
  "black",
];

export const BELT_GRAUS: readonly BeltGrau[] = [0, 1, 2, 3, 4];

/** 밖에서 들어온 값(요청 본문 등)을 띠로 읽는다. 모양이 틀리면 null. */
export function parseBelt(value: unknown): Belt | null {
  if (typeof value !== "object" || value === null) return null;
  const { rank, grau } = value as { rank?: unknown; grau?: unknown };
  if (!BELT_RANKS.includes(rank as BeltRank)) return null;
  if (!BELT_GRAUS.includes(grau as BeltGrau)) return null;
  return { rank: rank as BeltRank, grau: grau as BeltGrau };
}
