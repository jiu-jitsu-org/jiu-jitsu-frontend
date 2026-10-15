"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { NEUTRAL_BUTTON_PRESS } from "@/shared/ui/press-styles";

/**
 * 상세(게시글 · 밸런스 게임) 조회 실패 상태 — 안내 문구 + 재시도 버튼(화면 중앙).
 *
 * 모양 · 등장 · 재시도 방식은 메인 피드의 FeedErrorState와 같다. 그것을 그대로 쓰지 않는 이유는
 * 문구가 고정("잠시 문제가 생겼어요")이라 무엇을 못 불러왔는지 말할 수 없어서다.
 *
 * 상세 조회도 Server Component가 하므로 재시도는 router.refresh()로 라우트를 다시 렌더시킨다.
 * 조회가 세션 쿠키에 의존해 동적이라 refresh가 실제 재요청으로 이어진다. 재요청 동안은 연타를 막는다.
 * 서버가 준 오류 원문은 보여주지 않는다 — 사용자가 할 수 있는 일은 재시도뿐이라 읽을 이유가 없다.
 */
export function DetailErrorState({ title }: { title: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    // 뷰포트 전체 기준 가운데 정렬. 빈 화면에서 툭 튀지 않게 옅게 나타난다(피드 실패와 같은 fade-in).
    <div className="flex min-h-dvh flex-col items-center justify-center gap-[13px] px-4 text-center motion-safe:animate-fade-in">
      <p className="text-body-m text-feed-card-body-text">{title}</p>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => router.refresh())}
        // 피드 재시도 버튼과 같은 규격 · 같은 눌림(neutral 눌림 색).
        className={`h-[38px] rounded-[10px] bg-button-neutral-default-bg px-4 text-button-m text-button-neutral-default-text disabled:bg-button-neutral-disabled-bg disabled:text-button-neutral-disabled-text ${NEUTRAL_BUTTON_PRESS}`}
      >
        재시도
      </button>
    </div>
  );
}
