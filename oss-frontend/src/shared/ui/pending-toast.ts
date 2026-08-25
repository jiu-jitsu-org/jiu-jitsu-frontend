"use client";

import { useEffect } from "react";

import { useToast } from "@/shared/ui/toast";

/**
 * 화면을 떠나면서 남기는 토스트 — "다음에 전면에 오는 화면"이 대신 띄운다.
 *
 * WHY: 앱에서 게시글 상세는 목록과 **별도 웹뷰 인스턴스**다. 상세에서 토스트를 띄우고 곧바로
 * 서브뷰를 닫으면 토스트도 웹뷰와 함께 사라져 사용자가 못 본다. 그렇다고 닫기를 지연시키면
 * 신고한 글이 화면에 계속 남아 있는 어색한 구간이 생긴다.
 * → 문구만 남기고 즉시 닫은 뒤, 목록 웹뷰가 자기 차례에 소비한다.
 *
 * 전달 매체로 localStorage를 쓰는 이유: sessionStorage는 웹뷰/탭 단위로 격리돼 상세→목록으로
 * 넘어가지 않는다. 같은 origin의 웹뷰끼리는 localStorage를 공유하므로 브릿지 계약을 늘리지 않고
 * (= 앱 배포에 묶이지 않고) 전달할 수 있다.
 */
const STORAGE_KEY = "pending-toast";

/**
 * 소비되지 않은 문구의 유효 시간.
 *
 * 닫기 → 목록 복귀는 즉시 일어난다. 이보다 오래 남아 있다면 소비 시점을 놓친 것이므로
 * (앱 강제 종료, 복귀 감지 실패 등) 다음 실행에서 뜬금없는 토스트가 뜨지 않게 버린다.
 */
const TTL_MS = 10_000;

type PendingToast = {
  message: string;
  /** 발행 시각(ms) — TTL 판정용. */
  at: number;
};

/** 화면을 닫기 직전에 호출한다. 다음에 usePendingToast를 쓰는 화면이 이 문구를 띄운다. */
export function enqueuePendingToast(message: string): void {
  if (typeof window === "undefined") return;

  try {
    const entry: PendingToast = { message, at: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // 사파리 프라이빗 모드 등 스토리지 차단 환경. 토스트는 부가 안내이므로 조용히 포기한다.
  }
}

/** 저장된 문구를 꺼내면서 지운다(한 번만 노출). 없거나 만료면 null. */
function dequeuePendingToast(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    window.localStorage.removeItem(STORAGE_KEY);

    const entry = JSON.parse(raw) as Partial<PendingToast>;
    if (typeof entry.message !== "string" || typeof entry.at !== "number") {
      return null;
    }
    if (Date.now() - entry.at > TTL_MS) return null;

    return entry.message;
  } catch {
    return null;
  }
}

/**
 * 남겨진 토스트를 소비한다 — 목록처럼 "돌아오는 화면"에 건다.
 *
 * 마운트 한 번으로는 부족하다. 앱에서는 목록 웹뷰가 살아 있는 채로 가려졌다 돌아오고(마운트 없음),
 * 웹에서는 bfcache 복귀가 마운트를 일으키지 않는다. 그래서 복귀 신호 두 가지를 함께 듣는다.
 *
 * FIXME(#73): 앱에서 서브뷰 닫힘을 네이티브가 통지하게 되면(jiu-jitsu-org/jiu-jitsu-ios#22)
 * 그 신호에서도 소비해야 한다 — 가려진 웹뷰에 visibilitychange가 오지 않는 경우가 있다.
 */
export function usePendingToast(): void {
  const toast = useToast();

  useEffect(() => {
    function consume() {
      const message = dequeuePendingToast();
      if (message) toast.show(message);
    }

    consume();

    function handleVisibility() {
      if (document.visibilityState === "visible") consume();
    }

    window.addEventListener("pageshow", consume);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("pageshow", consume);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [toast]);
}
