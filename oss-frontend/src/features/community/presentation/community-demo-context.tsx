"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * 플레이그라운드(예시) 데모 모드.
 *
 * true면 실제 API 호출(좋아요/북마크/댓글 전송 등)을 건너뛰고 UX(낙관적 토글·입력 등)만 동작한다.
 * 예시 페이지가 PostDetailView를 DemoModeProvider로 감싸 켠다(실제 화면은 기본값 false → API 사용).
 */
const DemoModeContext = createContext(false);

export function DemoModeProvider({ children }: { children: ReactNode }) {
  return (
    <DemoModeContext.Provider value={true}>{children}</DemoModeContext.Provider>
  );
}

export function useIsDemoMode(): boolean {
  return useContext(DemoModeContext);
}
