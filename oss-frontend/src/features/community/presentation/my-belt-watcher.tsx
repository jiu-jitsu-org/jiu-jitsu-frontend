"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { useAuth } from "@/features/auth/presentation/auth-provider";
import { parseBelt, type Belt } from "@/features/community/domain/belt";
import { bffFetch } from "@/shared/lib/http/bff-fetch";
import {
  InboundMessageType,
  isNativeBridgeAvailable,
  registerWebBridge,
} from "@/shared/lib/native-bridge";

const BELT_PATH = "/api/community/profile/belt";
const MY_BELT_CHANGED_EVENT = "oss:my-belt-changed";
/** 웹에서 띠를 저장한 시각 — 같은 주소의 웹뷰끼리 함께 쓰는 localStorage에 남긴다(pending-toast와 같은 길). */
const BELT_CHANGED_STORAGE_KEY = "my-belt-changed-at";
/** 이 화면에서 띠를 저장했음 — 같은 문서의 MyBeltWatcher가 기준값을 저장한 띠로 맞춘다. */
const MY_BELT_SAVED_EVENT = "oss:my-belt-saved";

/**
 * 내 띠가 바뀌었으면 떠 있는 화면을 새로 그린다(#413).
 *
 * WHY: 띠는 앱 MY 화면(네이티브)에서 바꾸는데, 홈 피드·대회·상세 웹뷰는 살아 있는 채로 가려졌다 돌아온다.
 * 서버 렌더는 처음 열 때 한 번이고 피드는 불러온 카드를 쌓아 두므로, 아무도 다시 읽지 않아 이전 띠가 남았다.
 *
 * 띠가 바뀌었다는 신호가 오면 내 띠를 다시 읽고, 처음 본 값과 다르면 서버 렌더를 다시 돌리고(router.refresh)
 * 쌓아 둔 목록에도 알린다(useOnMyBeltChange). 띠가 그대로면 아무것도 하지 않는다.
 *
 * 신호(#542): 띠가 바뀌는 곳은 두 곳이고 둘 다 알린다 — 앱 MY 저장은 열린 웹뷰 모두에 PROFILE_UPDATED를,
 * 웹 띠 묻기 저장은 localStorage에 저장 시각(markMyBeltChanged)을 남긴다. 그래서 앱에서는 다시 보일 때
 * 서버를 읽지 않고 저장 시각만 보고, 바뀌었을 때만 읽는다 — 탭을 오가고 상세를 닫을 때마다 BFF가 BE 전체
 * 프로필을 받던 요청을 없앤다. 읽기가 실패하면 다음 신호에 다시 읽는다. 다른 기기에서 바꾼 띠는 화면을 새로 열 때 반영된다.
 * 외부 브라우저(브릿지 없음)와 localStorage를 못 쓰는 환경은 지금처럼 다시 보일 때마다 읽는다.
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
    // 마지막으로 반영한 웹 띠 저장 시각 — 이 화면이 뜬 뒤의 표시만 본다. undefined면 저장소를 못 써서 비교할 수 없다.
    let seenAt = readBeltChangedAt();
    // 읽기가 실패해 아직 반영하지 못한 신호가 있는지 — 다음 신호(다시 보일 때 · 포커스 · 터치)에 다시 읽는다.
    let pending = false;
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
          // 읽기 전에 본 표시까지만 반영한 것으로 친다 — 읽는 사이 새로 저장했으면 다음에 또 읽는다.
          const markAt = readBeltChangedAt();
          const key = await readMyBeltKey();
          if (cancelled) return;
          if (key === null) {
            pending = true;
            continue;
          }
          pending = false;
          if (markAt !== undefined && seenAt !== undefined) {
            seenAt = Math.max(seenAt, markAt);
          }

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

    // 저장소 값 하나만 본다 — 자주 불러도 가볍다. 웹 저장 표시가 새로웠거나 지난 읽기가 실패했을 때만 읽는다.
    function checkIfChanged() {
      if (pending) {
        void check();
        return;
      }
      const markAt = readBeltChangedAt();
      if (markAt !== undefined && seenAt !== undefined && markAt > seenAt) {
        void check();
      }
    }

    function handleVisible() {
      if (document.visibilityState !== "visible") return;
      // 외부 브라우저 · 저장소를 못 쓰는 환경은 알림을 다 받을 수 없어 지금처럼 다시 보일 때마다 읽는다.
      if (!isNativeBridgeAvailable() || seenAt === undefined) {
        void check();
        return;
      }
      // 앱: 앱 MY 변경은 PROFILE_UPDATED로 오므로, 다시 보일 때는 웹에서 저장한 표시만 본다.
      checkIfChanged();
    }

    // 다른 웹뷰가 띠를 저장했다 — 이 화면이 보이고 있으면 바로 확인한다.
    function handleStorage(event: StorageEvent) {
      if (event.key === BELT_CHANGED_STORAGE_KEY) checkIfChanged();
    }

    // 이 화면에서 저장했다 — 띠 묻기가 이미 새로 그렸으니(router.refresh) 기준값만 저장한 띠로 맞춰
    // 다시 보일 때 헛되이 읽거나 다시 그리지 않게 한다.
    function handleSaved(event: Event) {
      const { detail } = event as CustomEvent<{ at: number; key: string }>;
      if (!detail) return;
      if (seenAt !== undefined) seenAt = Math.max(seenAt, detail.at);
      lastKeyRef.current = detail.key;
    }

    const unregister = registerWebBridge((message) => {
      if (message.type === InboundMessageType.PROFILE_UPDATED) void check();
    });
    document.addEventListener("visibilitychange", handleVisible);
    window.addEventListener("pageshow", handleVisible);
    window.addEventListener(MY_BELT_SAVED_EVENT, handleSaved);
    // 앱 하단 탭은 가린 탭의 웹뷰를 투명하게만 해, 탭을 바꿔 돌아와도 visibilitychange가 오지 않을 수 있다
    // (BlockChangeWatcher와 같은 이유). 저장소 변경 · 포커스 · 첫 터치에서도 저장 표시를 본다.
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", checkIfChanged);
    document.addEventListener("pointerdown", checkIfChanged, {
      capture: true,
      passive: true,
    });
    // 처음 한 번은 기준값만 잡는다(이 화면은 방금 최신 띠로 그려졌다).
    void check();

    return () => {
      cancelled = true;
      unregister();
      document.removeEventListener("visibilitychange", handleVisible);
      window.removeEventListener("pageshow", handleVisible);
      window.removeEventListener(MY_BELT_SAVED_EVENT, handleSaved);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", checkIfChanged);
      document.removeEventListener("pointerdown", checkIfChanged, {
        capture: true,
      });
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

/**
 * 웹에서 내 띠를 저장한 뒤 부른다(#542) — 같은 기기의 다른 웹뷰가 다시 보일 때 내 띠를 다시 읽는다.
 * 저장소를 못 쓰면 표시는 남지 않지만, 그런 환경의 MyBeltWatcher는 다시 보일 때마다 읽는다.
 */
export function markMyBeltChanged(belt: Belt): void {
  const at = Date.now();
  try {
    window.localStorage.setItem(BELT_CHANGED_STORAGE_KEY, String(at));
  } catch {
    // 사파리 프라이빗 모드 등 저장소 차단 — 위 설명대로 다시 보일 때 읽는 쪽이 맡는다.
  }
  window.dispatchEvent(
    new CustomEvent(MY_BELT_SAVED_EVENT, {
      detail: { at, key: beltKeyOf(belt) },
    }),
  );
}

/** 웹에서 띠를 저장한 시각(ms). 없으면 0, 저장소를 못 쓰면 undefined. */
function readBeltChangedAt(): number | undefined {
  try {
    return Number(window.localStorage.getItem(BELT_CHANGED_STORAGE_KEY)) || 0;
  } catch {
    return undefined;
  }
}

/** 비교용 띠 문자열("rank:grau"). */
function beltKeyOf(belt: Belt): string {
  return `${belt.rank}:${belt.grau}`;
}

/** 서버에서 내 띠를 읽어 비교용 문자열로 만든다. 읽지 못하면 null — 이번 확인은 건너뛴다. */
async function readMyBeltKey(): Promise<string | null> {
  try {
    const response = await bffFetch(BELT_PATH, { cache: "no-store" });
    if (!response.ok) return null;
    const body = (await response.json()) as { data?: { belt?: unknown } } | null;
    const belt = parseBelt(body?.data?.belt ?? null);
    return belt ? beltKeyOf(belt) : "none";
  } catch {
    return null;
  }
}
