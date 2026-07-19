"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { refreshSessionViaBridge } from "@/shared/lib/native-bridge";

/**
 * 만료 세션 복구 경계(서버 → 클라이언트 위임).
 *
 * SSR이 인증 조회 중 만료 토큰(A0003)을 만나면 서버는 스스로 토큰을 갱신할 수 없다(refreshToken은
 * 네이티브에만 있음). 익명으로 격하하면 네이티브(로그인)와 세션이 어긋나므로, 서버는 목록/상세
 * 대신 "session-expired"만 알리고, 갱신 가능한 이 클라이언트 컴포넌트에 복구를 위임한다.
 *
 * 복구: 네이티브에 갱신 요청(refreshSessionViaBridge) → 성공 시 새 토큰이 세션 쿠키에 심어지므로
 * router.refresh()로 SSR을 재실행하면 인증 상태로 화면이 다시 그려진다. 갱신 실패(웹 단독/로그아웃)
 * 면 fallback(에러)을 렌더한다.
 *
 * 루프 방지: 재실행 후에도 또 만료로 돌아오는 비정상 상황을 막기 위해, 같은 경로에서 최근
 * 30초 내 복구를 이미 시도했다면 바로 실패 처리한다(정상 복구는 성공 후 언마운트되어 재진입 없음).
 */
const RECOVERY_COOLDOWN_MS = 30_000;

export function SessionExpiredRecovery({
  loading,
  fallback,
}: {
  /** 복구(갱신) 진행 중 표시. SSR에서도 렌더되므로 서버 렌더 가능한 마크업이어야 한다. */
  loading: ReactNode;
  /** 갱신 실패 시 표시(재로그인 유도/에러 등). */
  fallback: ReactNode;
}) {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    // effect 재실행(StrictMode 등)에도 복구는 마운트당 한 번만 시작한다.
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;

    const attempt = async () => {
      const key = `session-recovery:${window.location.pathname}`;
      const last = Number(sessionStorage.getItem(key) ?? 0);
      // 최근 시도가 있으면 재실행 루프로 보고 중단(정상 복구는 성공→언마운트라 재진입하지 않는다).
      if (last && Date.now() - last < RECOVERY_COOLDOWN_MS) {
        throw new Error("session recovery cooldown");
      }
      sessionStorage.setItem(key, String(Date.now()));
      await refreshSessionViaBridge();
    };

    attempt()
      .then(() => {
        // 갱신 성공 → 새 쿠키로 SSR 재실행. 인증 상태면 이 컴포넌트는 더 이상 렌더되지 않는다.
        if (!cancelled) router.refresh();
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return <>{failed ? fallback : loading}</>;
}
