"use client";

import { useTransition } from "react";

import { SITE_NAME } from "@/shared/lib/site-metadata";
import { FallbackScreen } from "@/shared/ui/fallback-screen";

import "./globals.css";

/**
 * 루트 레이아웃까지 실패했을 때의 화면 (#503). 레이아웃을 대신하므로 `<html>` · `<body>`와 전역 스타일을
 * 직접 둔다. Provider(인증 · 토스트)는 없다 — FallbackScreen은 그것들 없이 그려진다.
 * metadata를 내보낼 수 없어 제목은 `<title>`로 둔다.
 */
export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const [retrying, startTransition] = useTransition();

  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <title>{SITE_NAME}</title>
        <FallbackScreen
          title="잠시 문제가 생겼어요"
          onRetry={() => startTransition(() => unstable_retry())}
          retrying={retrying}
          errorShown={{}}
        />
      </body>
    </html>
  );
}
