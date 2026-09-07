"use client";

import {
  CLOSING_SOON_TEXT,
  readRemainingParts,
} from "@/features/community/presentation/balance/balance-countdown";
import { useBalanceCountdown } from "@/features/community/presentation/balance/use-balance-countdown";
import { cn } from "@/shared/lib/cn";
import { TimerIcon } from "@/shared/ui/icons";

/**
 * 밸런스 게임 상세의 타이머 배지 — 카운트다운을 소유하는 **말단** 컴포넌트.
 *
 * 리스트·sticky 바가 쓰는 BalanceRemaining과 분리한 이유는 **표기 형태가 다르기 때문**이다.
 * 그쪽은 한 줄 문자열이지만 여기는 숫자(Title 2)와 단위(Body S)의 타이포·색이 갈려 조각으로
 * 그려야 한다. 계산 규칙(임계값·자릿수)은 balance-countdown에서 공유하므로 어긋나지 않는다.
 *
 * 나뉘어 있는 덕에 상세 디자인 가이드를 고쳐도 리스트·sticky 바는 움직이지 않는다.
 *
 * 매초 리렌더는 이 컴포넌트 안에 갇힌다 — 상위(BalanceVotePanel)는 초마다 다시 그리지 않는다.
 */

/** 마감 후 문구. 남은 시간 자리를 통째로 대체한다. */
const ENDED_TEXT = "투표가 종료되었어요";

/**
 * FIXME(jiu-jitsu-frontend#117): 색이 하드코딩이다.
 *
 * 디자인이 balance-game/countdown-badge/* 토큰 이름만 지정하고 매핑 값을 주지 않아, 우선
 * 캡처에서 읽은 값을 그대로 넣는다. 토큰이 정의되면 아래 상수만 클래스로 바꾸면 된다.
 *
 * 숫자에 leading-[normal]을 주는 이유: Title 2 토큰의 행간은 28인데 디자인은 "크기 20, 행높이
 * auto"다. 28이면 상하 여백 8을 지킬 때 배지가 44가 되어 지정 높이 40을 넘는다. 토큰 자체를
 * 고치면 알럿·바텀시트 제목까지 따라 움직이므로 여기서만 auto로 되돌린다.
 */
const VALUE_CLASS =
  "text-title-2 leading-[normal] text-[#292a2e] tabular-nums";

/** 단위 조각 — Body S. */
const LABEL_CLASS = "text-body-s text-[#70737c]";

/**
 * 마감 문구 — Body S. 색이 LABEL_CLASS(단위)와 갈린다.
 *
 * 마감 배지는 진행 중과 **색 체계가 통째로 다르다**: 남은 시간이 사라지고 문구 하나만 남으므로
 * 그 한 줄이 배지의 주 정보가 된다 — 보조 정보인 단위 색(#70737c)이 아니라 숫자와 같은
 * 무게(#292a2e)로 올라간다. 아이콘도 같은 이유로 ICON_ENDED_CLASS를 따로 쓴다.
 */
const ENDED_TEXT_CLASS = "text-body-s text-[#292a2e]";

/**
 * 아이콘 색 3종. 깜빡임 2색(default ↔ active)과 **마감색이 별개**다.
 *
 * 마감은 깜빡임이 멈춘 상태가 아니라 따로 지정된 상태라, 두 위상 어느 쪽도 재사용할 수 없다.
 */
const ICON_DEFAULT_CLASS = "text-[#70737c]";
const ICON_ACTIVE_CLASS = "text-[#0090ff]";
const ICON_ENDED_CLASS = "text-[#292a2e]";

export function BalanceDetailCountdown({
  endAt,
  serverTime,
  closed,
  onExpired,
}: {
  endAt: string;
  serverTime: string;
  /**
   * 마감 여부. 남은 시간 대신 마감 문구를 그리고 아이콘 깜빡임을 멈춘다.
   *
   * 카운트다운이 0에 닿았다고 스스로 넘기지 않는다 — 마감 판정은 서버 closed와 카운트다운을
   * 함께 보는 호출부의 일이다(BalanceVotePanel).
   */
  closed: boolean;
  /** 잔여 시간이 0에 닿는 순간 한 번. 마감 전환 트리거다. */
  onExpired?: () => void;
}) {
  const { label, remainMs } = useBalanceCountdown({
    endAt,
    serverTime,
    onExpired,
  });

  // 시각을 파싱하지 못하면 배지를 통째로 감춘다. 단 마감이라고 들었으면 시각과 무관한 사실이라 남긴다.
  if (label === null && !closed) return null;

  /**
   * 아이콘 깜빡임 — 1초 주기로 default ↔ active.
   *
   * 위상을 남은 초에서 파생시켜 별도 타이머를 두지 않는다(틱이 둘이면 문구 갱신과 어긋난다).
   * 서버·클라이언트가 같은 값을 보므로 hydration 불일치도 없다.
   */
  const iconDimmed =
    !closed && remainMs !== null && Math.floor(remainMs / 1000) % 2 === 1;

  // 마감이 깜빡임의 한 위상이 아니므로 3분기다(ICON_ENDED_CLASS 주석 참고).
  const iconColorClass = closed
    ? ICON_ENDED_CLASS
    : iconDimmed
      ? ICON_DEFAULT_CLASS
      : ICON_ACTIVE_CLASS;

  const parts = remainMs === null ? null : readRemainingParts(remainMs);

  return (
    // 높이 40 고정 · radius 16 · 조각 사이 간격 5(아이콘 ↔ 첫 숫자 포함).
    // 상하 8은 패딩으로 두되 높이가 40으로 고정이라 실제로는 가운데 정렬이 자리를 잡는다.
    <div className="inline-flex h-10 items-center gap-[5px] rounded-2xl bg-[#edeff0] px-4 py-2">
      <TimerIcon
        size={16}
        className={cn("shrink-0 transition-colors", iconColorClass)}
      />

      {closed ? (
        <span className={ENDED_TEXT_CLASS}>{ENDED_TEXT}</span>
      ) : parts === null || parts.kind === "closing-soon" ? (
        // 1분 미만은 셀 숫자가 없어 단위와 같은 폼(Body S)으로 한 덩어리다.
        <span className={LABEL_CLASS}>{CLOSING_SOON_TEXT}</span>
      ) : (
        <>
          {/* 시간이 0이면 단위째 뺀다 — "42분 08초 남음"이 된다. */}
          {parts.hours !== null ? (
            <>
              <span className={VALUE_CLASS}>{parts.hours}</span>
              <span className={LABEL_CLASS}>시간</span>
            </>
          ) : null}
          <span className={VALUE_CLASS}>{parts.minutes}</span>
          <span className={LABEL_CLASS}>분</span>
          <span className={VALUE_CLASS}>{parts.seconds}</span>
          <span className={LABEL_CLASS}>초 남음</span>
        </>
      )}
    </div>
  );
}
