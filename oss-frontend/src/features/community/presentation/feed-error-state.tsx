"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

/**
 * 메인 피드 조회 실패 상태 — 안내 문구 + 재시도 버튼(화면 중앙).
 *
 * 목록 조회는 Server Component가 하므로 재시도는 router.refresh()로 해당 라우트를
 * 다시 렌더시킨다. 조회가 세션 쿠키(readSessionToken)에 의존해 동적이라 refresh가
 * 실제 재요청으로 이어진다. 재요청 동안은 pending 처리해 연타를 막는다.
 */
export function FeedErrorState() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    // 컨텐츠 묶음은 뷰포트 전체 기준 가로·세로 가운데 정렬.
    <div className="flex min-h-screen flex-col items-center justify-center gap-[13px] px-4 text-center">
      <p className="text-body-m text-feed-card-body-text">
        잠시 문제가 생겼어요
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => router.refresh())}
        className="h-[38px] rounded-[10px] bg-button-neutral-default-bg px-4 text-button-m text-button-neutral-default-text disabled:bg-button-neutral-disabled-bg disabled:text-button-neutral-disabled-text"
      >
        재시도
      </button>
    </div>
  );
}
