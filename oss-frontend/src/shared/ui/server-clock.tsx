"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/**
 * 서버 시각 기준 시계 (시간 표시 정책 1 · 3, #188).
 *
 * 상대 시간("5분 전")은 서버 시각 기준으로 계산하고, 화면에 머무는 동안 60초마다 · 포그라운드 복귀
 * 즉시 다시 계산해야 한다. 서버가 응답 시점에 만든 문자열(timeAgo)은 굳어 있어 이 정책을 못 지킨다.
 *
 * 기준 시각: 페이지(Server Component)가 렌더한 시각을 serverNow로 받아, 마운트 시점의 기기 시계와의
 * 차이(오프셋)를 잡는다. 이후에는 기기 시계 + 오프셋으로 센다 — 기기 시계가 틀어져 있어도 결과는
 * 서버 기준이다(밸런스 카운트다운과 같은 방식). 네트워크 지연만큼의 오차는 분 단위 표기에 드러나지 않는다.
 *
 * SSR/hydration: 첫 렌더는 serverNow를 그대로 쓴다. 서버와 클라이언트가 같은 값으로 그려 불일치가 없다.
 *
 * 리렌더 범위: 매 틱마다 이 컨텍스트를 읽는 시간 라벨(RelativeTime)만 다시 그려진다. 목록 전체가
 * 다시 그려지지 않도록 시간을 읽는 쪽은 반드시 말단 컴포넌트여야 한다.
 */

/** 재계산 주기(ms). 정책상 60초. */
const TICK_MS = 60_000;

const ServerClockContext = createContext<number | null>(null);

/**
 * 페이지 단위로 감싼다(SessionHintProvider와 같은 자리). 루트 레이아웃에 두지 않는 이유: 정적
 * 페이지(정책 문서 등)는 빌드 시각이 serverNow로 굳고, 클라이언트 이동 시 레이아웃은 다시 렌더되지
 * 않아 그 값이 세션 내내 남는다.
 */
export function ServerClockProvider({
  serverNow,
  children,
}: {
  serverNow: number;
  children: ReactNode;
}) {
  const [now, setNow] = useState(serverNow);

  // 새로고침(router.refresh)으로 페이지가 다시 렌더되면 새 기준값으로 갈아탄다.
  const [trackedServerNow, setTrackedServerNow] = useState(serverNow);
  if (trackedServerNow !== serverNow) {
    setTrackedServerNow(serverNow);
    setNow(serverNow);
  }

  useEffect(() => {
    const offset = serverNow - Date.now();

    function sync() {
      setNow(Date.now() + offset);
    }

    // 앱 서브뷰 복귀는 visibilitychange, 웹 bfcache 복귀는 pageshow로 온다(pending-toast와 같은 신호).
    function syncIfVisible() {
      if (document.visibilityState === "visible") sync();
    }

    const intervalId = setInterval(sync, TICK_MS);
    window.addEventListener("pageshow", sync);
    document.addEventListener("visibilitychange", syncIfVisible);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("pageshow", sync);
      document.removeEventListener("visibilitychange", syncIfVisible);
    };
  }, [serverNow]);

  return (
    <ServerClockContext.Provider value={now}>
      {children}
    </ServerClockContext.Provider>
  );
}

/**
 * 현재 서버 기준 시각(ms). 60초마다 · 포그라운드 복귀 시 갱신된다.
 *
 * Provider 밖이면 기기 시계로 대신한다 — 감싸는 걸 빠뜨린 화면이 깨지지는 않지만 정책(서버 기준 ·
 * 주기 갱신)은 지켜지지 않으니, 시간을 그리는 페이지는 반드시 ServerClockProvider로 감싼다.
 */
export function useServerNow(): number {
  const now = useContext(ServerClockContext);
  const [fallback] = useState(() => Date.now());

  return now ?? fallback;
}
