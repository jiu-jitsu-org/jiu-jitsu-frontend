"use client";

import { useRouter } from "next/navigation";

import { setNextScreenFrom, trackSelectContent } from "@/shared/lib/analytics";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";

/**
 * 끝난 판 상세의 '오늘의 밸런스 게임 보기'(#683) — 결과 알림 · 내 활동 · 지난 판 링크로 끝난 판에 들어온 사람을
 * 오늘 판으로 이어 준다. 보는 중에 마감된 경우는 마감 토스트의 같은 이름 버튼이 맡는다(use-balance-close-transition).
 *
 * 그 토스트 버튼과 같은 길로 간다 — replace(끝난 판은 뒤로가기로 돌아갈 곳이 아니다), 들어온 길은 balance_closed.
 * 판(먹색 스코어보드)과 같은 색의 꽉 찬 버튼이다.
 */
export function BalanceTodayLink({
  todayContentId,
  className,
}: {
  todayContentId: number;
  className?: string;
}) {
  const router = useRouter();

  return (
    <Button
      size="l"
      onClick={() => {
        // 여는 함수를 거치지 않는 길이라 열람 기록도 여기서 남긴다(#619).
        trackSelectContent("balance_game", todayContentId, "balance_closed");
        setNextScreenFrom("balance_closed");
        router.replace(`/community/balance/${todayContentId}`);
      }}
      className={cn(
        "w-full bg-[var(--cool-gray-900)] text-text-on-dark not-disabled:active:bg-[var(--cool-gray-800)]",
        className,
      )}
    >
      오늘의 밸런스 게임 보기
    </Button>
  );
}
