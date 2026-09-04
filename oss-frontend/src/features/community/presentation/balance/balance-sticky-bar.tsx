"use client";

import { useBalanceCountdown } from "@/features/community/presentation/balance/use-balance-countdown";
import { ChevronDownIcon } from "@/shared/ui/icons";

/**
 * 밸런스 게임 sticky 바 — 풀 카드가 화면 밖으로 나간 뒤 상단에 고정된다.
 *
 * 언제 보일지(카드가 완전히 벗어났는지 · 미투표인지)는 상위가 판단한다. 여기서는 보이기만 한다.
 *
 * fixed로 콘텐츠 위를 덮는다. sticky(문서 흐름 유지) 대신 fixed를 쓰는 이유는, 풀 카드가 이미
 * 스크롤 밖으로 나간 뒤에 나타나는 별도 요소라 흐름 안에 자리를 만들면 그만큼 피드가 밀려서다.
 * 아래 콘텐츠와 겹치는 경계는 불투명 배경 + 테두리 + 그림자가 만든다 — 떠 있는 판이라는 것을
 * 재질로 드러낸다.
 *
 * 상단 앱바(피드/카테고리)는 네이티브라 이 웹뷰의 top이 곧 앱바 바로 아래다. 다만 웹 단독으로
 * 열렸을 때는 상태바 인셋이 잡히므로 safe-area만큼 밀어 준다(인셋이 없으면 0이라 그대로다).
 */

/** 문구 앞머리. 잔여 시간을 만들지 못했을 때는 이것만 남는다. */
const TITLE = "오늘의 밸런스 게임";

export function BalanceStickyBar({
  endAt,
  serverTime,
  onPress,
}: {
  endAt: string;
  serverTime: string;
  onPress: () => void;
}) {
  return (
    <div className="fixed inset-x-0 top-0 z-20 px-4 pt-[env(safe-area-inset-top)]">
      <button
        type="button"
        onClick={onPress}
        className={
          // 테두리는 안쪽으로 그린다 — Tailwind가 box-sizing: border-box라 1px이 바 크기를 늘리지 않는다.
          // blue-200은 시맨틱 토큰을 거치지 않는 원시값이라 Tailwind 색으로 노출돼 있지 않다(page.tsx와 같은 방식).
          // 그림자는 디자인의 drop shadow 2겹을 순서대로 옮긴 것이다(0/4/4 25% 위에 0/2/2 6%).
          // gap-2.5는 텍스트와 아이콘 사이 **최소** 간격이다 — 아이콘은 ml-auto로 오른쪽 끝에 붙고,
          // 문구가 길어져 남는 자리가 사라지면 이 10에서 멈춘다.
          "mt-4 flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-[var(--blue-200)] bg-poll-sticky-bar-bg px-4 py-3 text-poll-sticky-bar-text shadow-[0_4px_4px_rgba(0,0,0,0.25),0_2px_2px_rgba(0,0,0,0.06)]"
        }
      >
        <StickyLabel endAt={endAt} serverTime={serverTime} />

        {/*
          오른쪽 끝 화살표. 전용 chevron-right 아이콘이 아직 없어 down을 -90° 돌려 쓴다.
          shrink-0은 문구가 길 때 16을 지키기 위한 것이다 — flex 안에서 svg는 줄어든다.
        */}
        <ChevronDownIcon
          size={16}
          className="ml-auto shrink-0 -rotate-90 text-poll-sticky-bar-icon"
        />
      </button>
    </div>
  );
}

/**
 * 바 문구 — 카운트다운을 소유하는 **말단** 컴포넌트.
 *
 * 제목·구분점·잔여 시간이 한 덩어리 텍스트다(디자인). 구분점도 문구의 일부라 별도 요소로 두지
 * 않는다 — 조각으로 나누면 자간이 조각마다 따로 잡혀 한 줄로 읽히지 않는다.
 *
 * 그래서 풀 카드가 쓰는 BalanceRemaining(자기 span과 아이콘을 그리는 컴포넌트)을 쓰지 못하고
 * 훅을 직접 부른다. 다만 훅은 매초 리렌더를 일으키므로 컴포넌트를 한 겹 나눠 둔다 — 리렌더가
 * 이 span 밖(바 배경·테두리·아이콘)으로 새지 않는다.
 *
 * 만료 통지(onExpired)는 넘기지 않는다. 풀 카드와 동시에 마운트돼 있어 양쪽이 알리면 재조회가
 * 두 번 걸린다(BalanceRemaining 주석 참조).
 */
function StickyLabel({
  endAt,
  serverTime,
}: {
  endAt: string;
  serverTime: string;
}) {
  const { label: remaining } = useBalanceCountdown({ endAt, serverTime });

  return (
    // 잔여 시간을 만들지 못하면 구분점까지 함께 뺀다 — "오늘의 밸런스 게임 · "로 끝나지 않도록.
    <span className="text-body-s">
      {remaining === null ? TITLE : `${TITLE} · ${remaining}`}
    </span>
  );
}
