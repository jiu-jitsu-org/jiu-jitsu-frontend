"use client";

import { useBalanceCountdown } from "@/features/community/presentation/balance/use-balance-countdown";
import { cn } from "@/shared/lib/cn";
import { TimerIcon } from "@/shared/ui/icons";

/**
 * 잔여 시간 표기 — 카운트다운을 소유하는 **말단** 컴포넌트.
 *
 * WHY 별도 컴포넌트인가: 카운트다운은 매초 state를 바꾼다. 카드나 섹션에서 훅을 부르면 그
 * 트리 전체가 매초 리렌더된다. 실제로 매초 달라지는 것은 이 문구 하나뿐이므로, 여기까지
 * 내려와서 훅을 부른다 — 리렌더가 이 span 밖으로 새지 않는다.
 *
 * 문구를 만들 수 없으면(서버가 준 시각을 파싱하지 못함) 줄 전체를 감춘다. 아이콘만 덩그러니
 * 남지 않도록 아이콘도 이 컴포넌트가 함께 소유한다.
 */
export function BalanceRemaining({
  endAt,
  serverTime,
  onExpired,
  showIcon = false,
  className,
}: {
  endAt: string;
  serverTime: string;
  /**
   * 0 도달 시 한 번 호출된다.
   *
   * 풀 카드와 sticky 바가 동시에 떠 있을 수 있으므로(카드가 화면 밖으로 나가도 DOM에는 남는다)
   * **한쪽만** 넘긴다. 양쪽 다 넘기면 같은 순간에 재조회가 두 번 걸린다.
   */
  onExpired?: () => void;
  showIcon?: boolean;
  className?: string;
}) {
  const label = useBalanceCountdown({ endAt, serverTime, onExpired });

  if (label === null) return null;

  return (
    // 아이콘 ↔ 텍스트 간격 2 (디자인 실측).
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {/* 아이콘만 interactive-primary — 텍스트(tertiary)와 색이 다르다(디자인 실측). */}
      {showIcon ? (
        <TimerIcon size={16} className="text-interactive-primary" />
      ) : null}
      {/*
        매초 바뀌는 값이라 aria-live를 두지 않는다 — 스크린리더가 초마다 읽으면 카드의 다른
        내용을 들을 수 없다. 남은 시간은 보조 정보이고, 마감되면 카드가 다음 판으로 교체된다.
      */}
      <span className="text-label-m">{label}</span>
    </span>
  );
}
