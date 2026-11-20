"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { FallbackScreen } from "@/shared/ui/fallback-screen";

/**
 * 수정할 글을 불러오지 못했을 때(시간 초과 · 5xx 등, 없는 글 제외)의 화면 (#503).
 *
 * 다시 시도는 상세 조회 실패(DetailErrorState)처럼 router.refresh()로 라우트를 다시 렌더시킨다.
 * 앱에서는 닫기도 둔다 — 수정 화면은 앱이 스와이프를 웹에 넘겨(이탈 가드) 버튼 말고는 나갈 길이 없다.
 */
export function PostEditLoadFailed({
  status,
  code,
}: {
  /** 조회 실패의 상태 · 코드 — 오류 기록(#583)의 종류를 가른다. */
  status: number;
  code: string;
}) {
  const router = useRouter();
  const [retrying, startTransition] = useTransition();

  return (
    <FallbackScreen
      title="글을 불러오지 못했어요"
      onRetry={() => startTransition(() => router.refresh())}
      retrying={retrying}
      errorShown={{ status, code, contentType: "post" }}
    />
  );
}
