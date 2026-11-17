"use client";

import { useTransition } from "react";

import { FallbackScreen } from "@/shared/ui/fallback-screen";

/**
 * 화면을 그리다 난 예외의 공통 화면 (#503). Next 영어 "Application error" 대신 한국어 안내 + 다시 시도.
 * 앱 서브뷰면 닫기, 브라우저면 홈으로도 둔다(FallbackScreen).
 * 다시 시도는 `unstable_retry` — 이 경계 아래를 서버에서 다시 받아 그린다(Next 16.2).
 */
export default function ErrorPage({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const [retrying, startTransition] = useTransition();

  return (
    <FallbackScreen
      title="잠시 문제가 생겼어요"
      onRetry={() => startTransition(() => unstable_retry())}
      retrying={retrying}
    />
  );
}
