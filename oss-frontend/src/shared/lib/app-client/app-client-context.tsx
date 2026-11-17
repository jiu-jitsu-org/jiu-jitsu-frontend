"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { parseAppClient, type AppClient } from "./app-client";

/**
 * 서버가 요청 User-Agent로 본 앱 여부 · 버전 힌트(#510).
 *
 * 루트 레이아웃에서 요청 값을 읽으면 정적 페이지(정책 문서)까지 동적 렌더로 바뀌어, 로그인 힌트(SessionHintProvider)처럼
 * 앱 · 브라우저로 화면이 갈리는 페이지만 서버에서 이 힌트를 깐다(AppClientHint). 깔지 않은 화면은 null.
 */
const AppClientHintContext = createContext<AppClient | null>(null);

export function AppClientHintProvider({
  client,
  children,
}: {
  client: AppClient;
  children: ReactNode;
}) {
  return (
    <AppClientHintContext.Provider value={client}>
      {children}
    </AppClientHintContext.Provider>
  );
}

/** 서버 힌트. 힌트를 깔지 않은 화면이면 null. */
export function useAppClientHint(): AppClient | null {
  return useContext(AppClientHintContext);
}

const subscribeNoop = () => () => {};

// 기기의 User-Agent는 바뀌지 않으니 한 번만 읽는다 — useSyncExternalStore가 같은 값을 받아야 다시 그리지 않는다.
let clientAppClient: AppClient | null = null;
function readClientAppClient(): AppClient {
  clientAppClient ??= parseAppClient(navigator.userAgent);
  return clientAppClient;
}

/**
 * 지금 앱 버전 — 앱이 아니거나 모르면 null. 버전으로 동작을 가를 때 appVersionAtLeast와 함께 쓴다.
 * 서버 렌더와 첫 하이드레이션은 서버 힌트(없으면 null), 그 뒤는 기기 User-Agent다 — 첫 렌더부터 맞아야 하는
 * 화면은 그 페이지에도 AppClientHint를 깐다. 힌트가 없으면 첫 렌더는 '버전 모름'이라 새 앱에서도 옛 동작이 한 번 스친다.
 */
export function useAppVersion(): string | null {
  const hint = useAppClientHint();
  return useSyncExternalStore(
    subscribeNoop,
    () => readClientAppClient().version,
    () => hint?.version ?? null,
  );
}
