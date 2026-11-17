/**
 * 인증 세션 도메인 타입.
 *
 * 현재 세션은 "네이티브 토큰을 httpOnly 쿠키로 보유하는가"로만 표현한다.
 * 사용자 프로필(닉네임 등)은 백엔드 프로필 API 명세가 확정되면 그때 추가한다.
 */
export type SessionState = {
  authenticated: boolean;
  /**
   * 세션 토큰의 사용자(JWT `sub`). 비로그인이거나 토큰에서 읽지 못하면 null.
   * 서명을 검증하지 않은 값이라 계정이 바뀌었는지 비교하는 데만 쓴다(#511) — 권한 판단에 쓰지 않는다.
   */
  userId: string | null;
  /** (DELETE만) 지우기 전에 세션 쿠키가 있었는지. 이미 비로그인이던 화면의 로그아웃을 가른다(#516). */
  cleared?: boolean;
};
