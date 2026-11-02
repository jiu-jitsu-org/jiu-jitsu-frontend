/**
 * 내가 차단한 회원 1명 — 설정 > 차단한 회원 목록의 한 줄.
 *
 * 업스트림 GET /user/block의 항목이다(backend#158).
 * 목록은 서버가 차단한 시각 최신순으로 내려주고, 탈퇴한 회원은 빠져 있다.
 */
export type BlockedMember = {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
  /** 차단한 시각(ISO 8601). */
  blockedAt: string;
};
