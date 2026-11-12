"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { useAuth } from "@/features/auth/presentation/auth-provider";
import { parseBelt } from "@/features/community/domain/belt";
import { bffFetch } from "@/shared/lib/http/bff-fetch";
import { InboundMessageType, registerWebBridge } from "@/shared/lib/native-bridge";

const BELT_PATH = "/api/community/profile/belt";
const MY_BELT_CHANGED_EVENT = "oss:my-belt-changed";

/**
 * 내 띠가 바뀌었으면 떠 있는 화면을 새로 그린다(#413).
 *
 * WHY: 띠는 앱 MY 화면(네이티브)에서 바꾸는데, 홈 피드·대회·상세 웹뷰는 살아 있는 채로 가려졌다 돌아온다.
 * 서버 렌더는 처음 열 때 한 번이고 피드는 불러온 카드를 쌓아 두므로, 아무도 다시 읽지 않아 이전 띠가 남았다.
 *
 * 화면이 다시 보일 때(visibilitychange·pageshow)와 앱이 PROFILE_UPDATED를 보낼 때 내 띠를 다시 읽고,
 * 처음 본 값과 다르면 서버 렌더를 다시 돌리고(router.refresh) 쌓아 둔 목록에도 알린다(useOnMyBeltChange).
 * 띠가 그대로면 아무것도 하지 않는다 — 탭을 오갈 때마다 화면이 다시 그려지지 않게.
 */
export function MyBeltWatcher() {
  const router = useRouter();
  const { status } = useAuth();
  // 마지막으로 확인한 내 띠("rank:grau", 미입력은 "none"). null이면 아직 기준값이 없다.
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") {
      // 로그아웃·다른 계정 로그인 때 지난 사람의 띠와 비교하지 않게 기준값을 비운다.
      lastKeyRef.current = null;
      return;
    }

    let cancelled = false;
    // 한 번에 하나만 읽는다. 읽는 중에 또 불리면(visibilitychange·pageshow·PROFILE_UPDATED가 겹침) 끝난 뒤 한 번 더.
    let running = false;
    let again = false;
    let attempts = 0;

    async function check() {
      if (running) {
        again = true;
        return;
      }
      running = true;
      try {
        do {
          again = false;
          const isFirst = attempts === 0;
          attempts += 1;
          const key = await readMyBeltKey();
          if (cancelled) return;
          if (key === null) continue;

          const previous = lastKeyRef.current;
          lastKeyRef.current = key;
          if (previous === key) continue;
          // 처음 읽기는 기준값만 잡는다(이 화면은 방금 최신 띠로 그려졌다).
          // 처음 읽기가 실패해 기준값이 없던 채로 늦게 읽혔다면, 그사이 바뀌었을 수 있어 한 번 새로 그린다.
          if (previous === null && isFirst) continue;

          router.refresh();
          window.dispatchEvent(new Event(MY_BELT_CHANGED_EVENT));
        } while (again && !cancelled);
      } finally {
        running = false;
      }
    }

    function handleVisible() {
      if (document.visibilityState === "visible") void check();
    }

    const unregister = registerWebBridge((message) => {
      if (message.type === InboundMessageType.PROFILE_UPDATED) void check();
    });
    document.addEventListener("visibilitychange", handleVisible);
    window.addEventListener("pageshow", handleVisible);
    // 처음 한 번은 기준값만 잡는다(이 화면은 방금 최신 띠로 그려졌다).
    void check();

    return () => {
      cancelled = true;
      unregister();
      document.removeEventListener("visibilitychange", handleVisible);
      window.removeEventListener("pageshow", handleVisible);
    };
  }, [router, status]);

  return null;
}

/** 내 띠가 바뀌었을 때 부른다 — 서버 렌더가 아니라 화면이 쌓아 둔 목록(피드 카드)을 다시 읽는 용도. */
export function useOnMyBeltChange(callback: () => void): void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    function handle() {
      callbackRef.current();
    }
    window.addEventListener(MY_BELT_CHANGED_EVENT, handle);
    return () => window.removeEventListener(MY_BELT_CHANGED_EVENT, handle);
  }, []);
}

/** 서버에서 내 띠를 읽어 비교용 문자열로 만든다. 읽지 못하면 null — 이번 확인은 건너뛴다. */
async function readMyBeltKey(): Promise<string | null> {
  try {
    const response = await bffFetch(BELT_PATH, { cache: "no-store" });
    if (!response.ok) return null;
    const body = (await response.json()) as { data?: { belt?: unknown } } | null;
    const belt = parseBelt(body?.data?.belt ?? null);
    return belt ? `${belt.rank}:${belt.grau}` : "none";
  } catch {
    return null;
  }
}
