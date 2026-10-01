"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * 서버가 요청 쿠키로 본 로그인 여부 힌트.
 *
 * AuthProvider는 루트 레이아웃에 있어 첫 렌더가 늘 loading이다(레이아웃에서 쿠키를 읽으면 정적
 * 페이지까지 전부 동적 렌더로 바뀐다). 로그인 여부로 UI가 갈리는 화면만 서버에서 이 힌트를 깔아
 * SSR과 첫 페인트를 맞춘다. 쿠키 존재만 보는 추정값이라 세션 판정이 끝나면 AuthProvider 값이 이긴다.
 * 소비는 useIsSignedIn을 통해서만 한다.
 */
const SessionHintContext = createContext(false);

export function SessionHintProvider({
  authenticated,
  children,
}: {
  authenticated: boolean;
  children: ReactNode;
}) {
  return (
    <SessionHintContext.Provider value={authenticated}>
      {children}
    </SessionHintContext.Provider>
  );
}

export function useSessionHint(): boolean {
  return useContext(SessionHintContext);
}
