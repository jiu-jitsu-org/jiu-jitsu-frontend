"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  formatRemaining,
  readRemainingAtResponse,
} from "@/features/community/presentation/balance/balance-countdown";

/**
 * 밸런스 게임 잔여 시간 틱.
 *
 * 반환값은 표기 문구다(계산 결과가 아니라). 호출부가 포맷 규칙을 다시 알 필요가 없고,
 * 풀 카드와 sticky 바가 같은 문구를 공유한다.
 *
 * **이 훅은 매초 리렌더를 일으킨다.** 반드시 타이머 문구를 실제로 그리는 말단 컴포넌트에서만
 * 호출한다. 피드 상위에서 호출하면 매초 피드 전체가 리렌더된다.
 *
 * 기준 시각: 기기 시계가 아니라 "응답 시점의 잔여 시간"(endAt - serverTime)에서 출발해,
 * 마운트 이후 흐른 시간만 기기 시계로 뺀다(readRemainingAtResponse 주석 참조).
 *
 * SSR/hydration: 첫 렌더는 Date.now()를 쓰지 않고 응답 시점 잔여 시간을 그대로 표기한다.
 * 서버와 클라이언트가 같은 값을 계산하므로 hydration 불일치가 없다. 마운트 직후 첫 틱에서
 * 그동안 흐른 시간이 반영된다(대개 1초 미만이라 눈에 띄지 않는다).
 */

/** 틱 간격(ms). 정책상 1초 갱신. */
const TICK_MS = 1_000;

export function useBalanceCountdown({
  endAt,
  serverTime,
  onExpired,
}: {
  endAt: string;
  serverTime: string;
  /** 잔여 시간이 0에 닿는 순간 한 번 호출된다(다음 판 재조회 트리거). */
  onExpired?: () => void;
}): string | null {
  const responseRemainMs = useMemo(
    () => readRemainingAtResponse(endAt, serverTime),
    [endAt, serverTime],
  );

  const [remainMs, setRemainMs] = useState(responseRemainMs);

  // 게임이 교체되면(다음 판) 새 잔여 시간으로 즉시 갈아탄다. effect를 기다리면 한 프레임 동안
  // 이전 판의 시간이 남아 보인다 — props에서 파생된 state를 조정하는 표준 패턴이다.
  const [trackedRemainMs, setTrackedRemainMs] = useState(responseRemainMs);
  if (trackedRemainMs !== responseRemainMs) {
    setTrackedRemainMs(responseRemainMs);
    setRemainMs(responseRemainMs);
  }

  // onExpired가 매 렌더 새 참조여도 타이머가 재시작되지 않도록 최신값만 ref로 들고 있는다.
  const onExpiredRef = useRef(onExpired);
  useEffect(() => {
    onExpiredRef.current = onExpired;
  });

  useEffect(() => {
    if (responseRemainMs === null) return;

    // 마운트 시점을 기준으로 종점을 고정한다. 이후 틱은 이 종점까지의 거리만 다시 잰다.
    const deadline = Date.now() + responseRemainMs;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let expired = false;

    function stop() {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }

    function update() {
      const next = Math.max(0, deadline - Date.now());
      setRemainMs(next);

      if (next > 0 || expired) return;

      // 0 도달은 한 번만 알린다. 알린 뒤에는 더 셀 것이 없으므로 타이머를 멈춘다
      // (교체된 게임이 내려오면 이 effect가 새 잔여 시간으로 다시 시작한다).
      expired = true;
      stop();
      onExpiredRef.current?.();
    }

    update();
    // 첫 계산에서 이미 만료됐다면 타이머를 걸지 않는다 — 위 stop()은 아직 id가 없어 못 걷는다.
    if (!expired) {
      intervalId = setInterval(update, TICK_MS);
    }

    return stop;
  }, [responseRemainMs]);

  // 파싱 불가(서버 계약 위반)면 문구를 만들지 않는다 — 호출부가 타이머 줄을 통째로 감춘다.
  // "NaN시간 남음"을 보여주느니 아예 없는 편이 낫다.
  return remainMs === null ? null : formatRemaining(remainMs);
}
