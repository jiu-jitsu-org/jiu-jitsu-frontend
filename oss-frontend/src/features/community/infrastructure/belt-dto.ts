import type { Belt, BeltGrau, BeltRank } from "@/features/community/domain/belt";

/**
 * 작성자 응답에 붙을 띠·그랄 필드 (#265).
 *
 * 서버는 아직 글·댓글 작성자(author)에 이 값을 주지 않는다 — 원본인 커뮤니티 프로필
 * (GET /community/profile)과 같은 이름·값으로 붙을 것으로 보고 자리만 둔다.
 * 예: beltRank "BLUE", beltStripe "STRIPE_2". 이름이 다르게 확정되면 여기만 고친다.
 */
export type AuthorBeltDto = {
  beltRank?: string | null;
  beltStripe?: string | null;
};

const BELT_RANKS: Record<string, BeltRank> = {
  WHITE: "white",
  BLUE: "blue",
  PURPLE: "purple",
  BROWN: "brown",
  BLACK: "black",
};

const BELT_GRAUS: Record<string, BeltGrau> = {
  STRIPE_0: 0,
  STRIPE_1: 1,
  STRIPE_2: 2,
  STRIPE_3: 3,
  STRIPE_4: 4,
};

/** 띠 색을 모르면(없음·키즈 띠 등) null — 화면은 띠 없는 기존 아바타를 그린다. 그랄을 모르면 0. */
export function toBelt(dto: AuthorBeltDto | null | undefined): Belt | null {
  const rank = dto?.beltRank ? BELT_RANKS[dto.beltRank] : undefined;
  if (!rank) return null;

  return {
    rank,
    grau: (dto?.beltStripe && BELT_GRAUS[dto.beltStripe]) || 0,
  };
}

/** toBelt의 반대 — 띠를 서버 값(beltRank "BLUE", beltStripe "STRIPE_2")으로 바꾼다. */
export function toBeltDto(belt: Belt): { beltRank: string; beltStripe: string } {
  return {
    beltRank: belt.rank.toUpperCase(),
    beltStripe: `STRIPE_${belt.grau}`,
  };
}
