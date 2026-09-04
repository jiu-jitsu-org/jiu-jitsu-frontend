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

/** 마감 후 문구. 남은 시간 자리를 그대로 대체한다. */
const CLOSED_LABEL = "투표가 종료되었어요";

export function BalanceRemaining({
  endAt,
  serverTime,
  onExpired,
  showIcon = false,
  blinkIcon = false,
  closed = false,
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
  /**
   * 아이콘을 1초 주기로 회색 ↔ 파랑 번갈아 표시할지(상세 전용 정책).
   *
   * 마감되면 멈춘다 — 셀 것이 없는데 깜빡이면 아직 진행 중이라는 신호가 된다.
   */
  blinkIcon?: boolean;
  /**
   * 마감 여부. true면 남은 시간 대신 마감 문구를 그리고 깜빡임을 멈춘다.
   *
   * **잔여 시간이 0에 닿았다고 스스로 마감으로 넘기지 않는다.** 마감 판정은 서버의 closed와
   * 카운트다운을 함께 보는 호출부의 일이고(둘 중 하나라도 마감이면 마감), 이 컴포넌트는 들은
   * 대로 그린다. 스스로 판정하면 리스트처럼 마감 문구를 쓰지 않는 화면까지 문구가 바뀐다 —
   * 리스트는 0에 닿는 즉시 다음 판으로 교체되므로 마감 표기가 필요 없다.
   */
  closed?: boolean;
  className?: string;
}) {
  const { label, remainMs } = useBalanceCountdown({
    endAt,
    serverTime,
    onExpired,
  });

  // 파싱 실패는 줄을 통째로 감춘다. 단 마감이라고 들었으면 그건 시각과 무관한 사실이라 남긴다.
  if (label === null && !closed) return null;

  /**
   * 깜빡임 위상을 남은 초에서 파생시킨다.
   *
   * 별도 타이머를 두지 않는 이유는 훅 주석 참조 — 틱이 둘이면 위상이 어긋난다. 서버·클라이언트가
   * 같은 값에서 계산하므로 hydration 불일치도 없다.
   */
  const iconDimmed =
    blinkIcon &&
    !closed &&
    remainMs !== null &&
    Math.floor(remainMs / 1000) % 2 === 1;

  return (
    // 아이콘 ↔ 텍스트 간격 2 (디자인 실측).
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {/* 아이콘만 interactive-primary — 텍스트(tertiary)와 색이 다르다(디자인 실측). */}
      {showIcon ? (
        <TimerIcon
          size={16}
          className={cn(
            "transition-colors",
            iconDimmed
              ? "text-feed-card-header-date-text"
              : "text-interactive-primary",
          )}
        />
      ) : null}
      {/*
        매초 바뀌는 값이라 aria-live를 두지 않는다 — 스크린리더가 초마다 읽으면 카드의 다른
        내용을 들을 수 없다. 남은 시간은 보조 정보이고, 마감되면 카드가 다음 판으로 교체된다.
      */}
      <span className="text-label-m">{closed ? CLOSED_LABEL : label}</span>
    </span>
  );
}
