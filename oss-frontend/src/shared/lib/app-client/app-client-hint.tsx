import { headers } from "next/headers";
import type { ReactNode } from "react";

import { parseAppClient } from "./app-client";
import { AppClientHintProvider } from "./app-client-context";

/**
 * 요청 User-Agent로 앱 여부 · 버전을 읽어 아래 화면에 깐다(#510) — 서버 컴포넌트.
 *
 * 로그인 힌트(SessionHintProvider)와 같은 자리, 앱 · 브라우저로 화면이 갈리는 동적 페이지에만 둔다. 앱바가 갈리는
 * 상세의 로딩 스켈레톤(loading.tsx)은 자기 Suspense 안에서 따로 깐다. layout에 두면 헤더를 기다리는 동안 상위 loading
 * (홈 피드 · 대회 목록 스켈레톤)이 먼저 보일 수 있다 — loading.tsx는 같은 세그먼트의 layout을 감싸지 않는다.
 * 요청 헤더를 읽어 그 페이지는 동적 렌더가 된다(이미 쿠키를 읽는 페이지들이다). 동적 페이지는 Next가
 * `private, no-store`로 보내 공유 캐시가 앱 · 브라우저 결과를 섞지 않는다.
 */
export async function AppClientHint({ children }: { children: ReactNode }) {
  const client = parseAppClient((await headers()).get("user-agent"));
  return (
    <AppClientHintProvider client={client}>{children}</AppClientHintProvider>
  );
}
