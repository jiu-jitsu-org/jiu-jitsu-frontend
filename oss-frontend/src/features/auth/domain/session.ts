/**
 * 인증 세션 도메인 타입.
 *
 * 현재 세션은 "네이티브 토큰을 httpOnly 쿠키로 보유하는가"로만 표현한다.
 * 사용자 프로필(닉네임 등)은 백엔드 프로필 API 명세가 확정되면 그때 추가한다.
 */
export type SessionState = {
  authenticated: boolean;
};
