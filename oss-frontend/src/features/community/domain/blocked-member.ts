/**
 * 내가 차단한 회원 1명 — 설정 > 차단한 회원 목록의 한 줄.
 *
 * 업스트림 GET /user/block(백엔드 요청 중 — docs/blocked-members-plan.md)의 항목이다.
 * 목록은 서버가 차단한 시각 최신순으로 내려준다.
 */
export type BlockedMember = {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
  /** 차단한 시각(ISO 8601). */
  blockedAt: string;
};
