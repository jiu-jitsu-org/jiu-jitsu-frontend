import { cookies } from "next/headers";

import {
  SESSION_COOKIE_MAX_AGE_SECONDS,
  SESSION_COOKIE_NAME,
} from "@/config/auth";

/**
 * 세션 쿠키 read/write/clear 유틸.
 *
 * accessToken을 httpOnly 쿠키로만 보관해 브라우저 JS가 토큰을 읽지 못하게 한다.
 * Next 16에서 `cookies()`는 async 이므로 반드시 await 한다.
 * set/delete는 Route Handler 또는 Server Function에서만 호출 가능하다.
 */

/** 요청에 담긴 세션 토큰을 읽는다. 없으면 null. */
export async function readSessionToken(): Promise<string | null> {
  const store = await cookies();

  return store.get(SESSION_COOKIE_NAME)?.value ?? null;
}

/**
 * 세션 토큰을 httpOnly 쿠키로 발급한다.
 * @param maxAgeSeconds 토큰 만료 기반 수명. 미지정 시 기본값 사용.
 */
export async function writeSessionToken(
  accessToken: string,
  maxAgeSeconds: number = SESSION_COOKIE_MAX_AGE_SECONDS,
): Promise<void> {
  const store = await cookies();

  store.set(SESSION_COOKIE_NAME, accessToken, {
    httpOnly: true,
    // 로컬 개발(http)에서는 secure 쿠키가 저장되지 않으므로 운영에서만 활성화한다.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

/** 세션 쿠키를 제거한다(로그아웃). */
export async function clearSessionToken(): Promise<void> {
  const store = await cookies();

  store.delete(SESSION_COOKIE_NAME);
}
