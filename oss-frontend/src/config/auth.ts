/**
 * 인증 세션 고정 설정.
 *
 * WHY config: 컨벤션상 런타임 설정/상수는 src/config에 중앙화한다. 쿠키 이름·수명이
 * 여러 레이어(route handler, 세션 유틸)에서 쓰이므로 한 곳에서 관리한다.
 */

/** 세션(accessToken)을 담는 httpOnly 쿠키 이름. */
export const SESSION_COOKIE_NAME = "oss_session";

/** 세션 쿠키 기본 수명(초). 토큰 expiresAt이 없을 때의 폴백 = 7일. */
export const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
