"use client";

import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";

import {
  CONNECTION_LOST_MESSAGE,
  useOnline,
  useRetryWhenOnline,
} from "@/features/community/presentation/connection-lost";

import {
  trackErrorShown,
  type ErrorShownDetail,
} from "@/shared/lib/analytics/error-shown";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";

/**
 * 메인 피드 조회 실패 상태 — 안내 문구 + 재시도 버튼(화면 중앙).
 *
 * 목록 조회는 Server Component가 하므로 재시도는 router.refresh()로 해당 라우트를
 * 다시 렌더시킨다. 조회가 세션 쿠키(readSessionToken)에 의존해 동적이라 refresh가
 * 실제 재요청으로 이어진다. 재요청 동안은 pending 처리해 연타를 막는다.
 *
 * 앱바가 있는 화면(내 커뮤니티 활동)은 뷰포트 전체 높이를 쓰면 앱바만큼 스크롤이 생겨
 * className으로 높이를 줄인다.
 *
 * 홈 카테고리 탭(#590)처럼 클라이언트가 BFF로 읽은 목록은 onRetry로 그 목록만 다시 읽는다.
 * 브라우저에서 직접 읽은 목록(글 검색, #591)은 router.refresh로 다시 읽히지 않아 onRetry로 재시도를 넘긴다.
 *
 * 붙을 때 오류 기록(`error_shown`, #583)을 한 번 남긴다 — 실패의 상태 · 코드를 아는 화면은 `error`로 넘긴다.
 */
export function FeedErrorState({
  className,
  onRetry,
  error,
}: {
  className?: string;
  /** 다시 시도. 없으면 라우트를 다시 렌더한다(router.refresh). */
  onRetry?: () => void;
  /** 오류 기록에 실을 실패 상태 · 코드. 모르면 비운다. */
  error?: ErrorShownDetail;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // 망이 끊겨 있으면 연결 문구로 바꾸고, 돌아오면 한 번 저절로 다시 불러온다(#543).
  // 끊긴 채 router.refresh를 부르면 Next가 문서 이동으로 넘어가 브라우저 오프라인 화면이 뜬다 — 재시도는 연결을 기다린다.
  const online = useOnline();
  // 목록을 따로 읽는 화면(카테고리 탭 · 글 검색)은 onRetry로, 그 밖에는 라우트를 다시 렌더한다.
  const retry = () =>
    onRetry ? onRetry() : startTransition(() => router.refresh());
  useRetryWhenOnline(retry);

  // 붙을 때 한 번 — 다시 시도가 또 실패해 이 화면이 남아 있으면 다시 세지 않는다.
  useEffect(() => {
    trackErrorShown(error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // 컨텐츠 묶음은 뷰포트 전체 기준 가로·세로 가운데 정렬. 빈 화면에서 툭 튀지 않게 옅게 나타난다.
    <div
      className={cn(
        "flex min-h-screen flex-col items-center justify-center gap-[13px] px-4 text-center motion-safe:animate-fade-in",
        className,
      )}
    >
      <p className="text-body-m text-feed-card-body-text">
        {online ? "잠시 문제가 생겼어요" : CONNECTION_LOST_MESSAGE}
      </p>
      {/* 누르는 동안 neutral 눌림 색으로 짙어진다(빈 상태 글쓰기 버튼과 같은 규격·같은 눌림). */}
      <Button
        variant="neutral"
        size="m"
        disabled={pending}
        data-ga="retry"
        onClick={() => {
          if (navigator.onLine) retry();
        }}
      >
        재시도
      </Button>
    </div>
  );
}
