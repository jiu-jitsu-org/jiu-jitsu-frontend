"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";

import {
  isNativeBridgeAvailable,
  openNativeSubview,
} from "@/shared/lib/native-bridge";
import { cn } from "@/shared/lib/cn";

/** 대회 상세 웹 경로(#361). */
export function competitionDetailPath(competitionId: string): string {
  return `/competition/${encodeURIComponent(competitionId)}`;
}

/** 같은 화면에서 상세를 다시 열 수 있게 되기까지(ms) — 빠르게 두 번 누르면 앱에 상세가 두 겹 쌓인다. */
const OPEN_LOCK_MS = 600;

/** 목록에서 상세를 열었는지 — 돌아왔을 때 관심 상태를 다시 읽을지 정한다. */
const DETAIL_OPENED_KEY = "oss.competition.detail-opened";

function markDetailOpened() {
  try {
    window.sessionStorage.setItem(DETAIL_OPENED_KEY, "1");
  } catch {
    // 저장소를 못 쓰면 돌아와도 다시 읽지 않는다 — 관심 표시가 잠깐 어긋날 뿐이다.
  }
}

function takeDetailOpened(): boolean {
  try {
    if (!window.sessionStorage.getItem(DETAIL_OPENED_KEY)) return false;
    window.sessionStorage.removeItem(DETAIL_OPENED_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * 대회 상세 열기 — 게시글 상세와 같은 갈래다.
 * 앱 웹뷰는 OPEN_SUBVIEW로 풀스크린 웹뷰를 띄워(목록 웹뷰는 그대로 남아 스크롤·필터가 유지된다),
 * 웹 단독은 같은 창에서 이동한다.
 */
export function useOpenCompetitionDetail() {
  const router = useRouter();
  const lockedUntil = useRef(0);
  return (competitionId: string) => {
    const now = Date.now();
    if (now < lockedUntil.current) return;
    lockedUntil.current = now + OPEN_LOCK_MS;
    const path = competitionDetailPath(competitionId);
    markDetailOpened();
    if (isNativeBridgeAvailable()) {
      openNativeSubview(`${window.location.origin}${path}`);
      return;
    }
    router.push(path);
  };
}

/**
 * 대회 이름 링크 — 줄(회색 박스) 전체를 누를 자리로 넓힌다(after 겹침).
 * 박스 안의 관심 버튼은 relative로 이 겹침 위에 올라 따로 눌린다.
 * 진짜 <a href>라 새 탭 열기·길게 눌러 주소 복사도 된다. 보조 키를 누른 클릭은 브라우저에 맡긴다.
 */
export function CompetitionDetailLink({
  competitionId,
  children,
  className,
}: {
  competitionId: string;
  children: ReactNode;
  className?: string;
}) {
  const open = useOpenCompetitionDetail();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    open(competitionId);
  }

  return (
    <a
      href={competitionDetailPath(competitionId)}
      onClick={handleClick}
      data-detail-link
      className={cn(
        "outline-none after:absolute after:inset-0 after:rounded-20 focus-visible:after:ring-2 focus-visible:after:ring-border-focus",
        className,
      )}
    >
      {children}
    </a>
  );
}

/**
 * 상세에서 돌아오면 서버 값(관심 상태·관심 수)을 다시 읽는다(#362).
 *
 * 앱은 상세 서브뷰가 닫히면 목록 웹뷰가 다시 보이며 visibilitychange가 오고(피드와 같은 신호),
 * 웹 단독은 뒤로 가기로 목록이 다시 그려질 때(마운트) 확인한다. 상세를 연 적이 있을 때만 다시 읽는다.
 */
export function useRefreshAfterDetail() {
  const router = useRouter();
  useEffect(() => {
    const refreshIfReturned = () => {
      if (document.visibilityState !== "visible") return;
      if (takeDetailOpened()) router.refresh();
    };
    refreshIfReturned();
    document.addEventListener("visibilitychange", refreshIfReturned);
    window.addEventListener("pageshow", refreshIfReturned);
    return () => {
      document.removeEventListener("visibilitychange", refreshIfReturned);
      window.removeEventListener("pageshow", refreshIfReturned);
    };
  }, [router]);
}
