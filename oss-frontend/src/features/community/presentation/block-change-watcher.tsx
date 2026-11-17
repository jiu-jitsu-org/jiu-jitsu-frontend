"use client";

import { useEffect, useRef } from "react";

import { InboundMessageType, registerWebBridge } from "@/shared/lib/native-bridge";

const BLOCK_CHANGED_EVENT = "oss:block-changed";
/** 웹에서 차단을 바꾼 시각(ms) — 같은 주소의 웹뷰끼리 기기 저장소를 같이 쓰는 것으로 다른 웹뷰에 알린다(#531). */
const BLOCK_CHANGED_AT_KEY = "block-changed-at";
/** 이 웹뷰가 남긴 표시 — 자기 표시로는 다시 읽지 않는다(그 화면은 이미 스스로 맞췄다). */
const BLOCK_MARKED_HERE_EVENT = "oss:block-marked-here";

function readBlockChangedAt(): number {
  try {
    return Number(window.localStorage.getItem(BLOCK_CHANGED_AT_KEY)) || 0;
  } catch {
    return 0;
  }
}

/**
 * 웹에서 회원 차단 · 해제가 성공하면 부른다(#531) — 댓글 ⋮ 차단, 설정 › 차단한 회원 해제.
 *
 * 앱은 웹에서 바꾼 차단을 모르니 USER_BLOCK_CHANGED를 보내지 않는다. 대신 기기 저장소에 시각을 남기면,
 * 뒤에 떠 있던 웹뷰(홈 피드 등)가 다시 보일 때 BlockChangeWatcher가 보고 앱 메시지와 같은 다시 읽기를 부른다.
 * 브릿지 계약을 늘리지 않아 앱 배포에 묶이지 않는다(상세 → 목록 토스트와 같은 길, shared/ui/pending-toast).
 */
export function markBlockChanged(): void {
  const at = Date.now();
  try {
    window.localStorage.setItem(BLOCK_CHANGED_AT_KEY, String(at));
  } catch {
    return;
  }
  window.dispatchEvent(new CustomEvent(BLOCK_MARKED_HERE_EVENT, { detail: at }));
}

/**
 * 앱에서 회원 차단·해제가 바뀌면 떠 있는 화면을 다시 불러온다(#488).
 *
 * WHY: 남의 프로필(앱, jiu-jitsu-ios#328)에서 차단하면, 뒤에 떠 있던 피드·상세 웹뷰는 차단 전 그대로라
 * 그 회원의 글·댓글이 보인다. 사용자가 거기서 다시 차단을 누르면 토글이라 풀리기 쉽다.
 *
 * 앱이 USER_BLOCK_CHANGED를 보내면 차단을 그리는 화면에 알리고(useOnBlockChange), 화면이 각자 다시 읽는다 —
 * 피드는 불러온 페이지를 다시 읽고(reloadLoaded), 상세는 댓글 목록이 서버 렌더를 다시 돌린다(router.refresh).
 * 여기서 일괄로 router.refresh하지 않는 이유: 홈은 서버 렌더가 실패하면 쌓아 둔 피드 대신 오류 화면을 그리는데,
 * 피드의 차단 반영은 reloadLoaded가 이미 맡고 있어 홈을 다시 그릴 이유가 없다. 차단과 무관한 화면도 다시 그리지 않는다.
 * 차단 필터는 서버가 하므로(목록에서 빼고 댓글은 자리 표시) 웹은 다시 읽기만 한다. payload(누구를 · 차단/해제)는
 * 쓰지 않는다 — 다시 읽으면 어느 쪽이든 서버 상태로 맞춰진다. 이 메시지를 보내지 않는 구버전 앱에서는 아무것도 하지 않는다.
 *
 * 웹에서 바꾼 차단(markBlockChanged)은 기기 저장소의 시각으로 알아챈다 — 다시 보일 때 마지막으로 본 시각보다
 * 새로우면 같은 다시 읽기를 부른다(#531). 앱 메시지와 겹쳐도 다시 보일 때 한 번만 읽는다.
 * 앱 하단 탭은 가린 탭의 웹뷰를 화면에 남겨 두고 투명하게만 해, 탭을 바꿔 돌아와도 visibilitychange가 오지 않을 수
 * 있다. 그래서 다른 웹뷰의 저장소 변경(storage), 포커스, 화면의 첫 터치에서도 같은 확인을 한다 — 확인은 저장소 값
 * 하나를 읽는 것뿐이라 자주 불러도 가볍다.
 *
 * 앱은 떠 있는 웹뷰 모두에 보내는데, 가려진 웹뷰는 그때 다시 읽지 않고 다시 보일 때(visibilitychange·pageshow)
 * 한 번만 읽는다. 프로필에서 차단 · 해제를 여러 번 바꿔도 돌아온 화면만 한 번 다시 읽고, 상세를 다시 읽을 때마다
 * 오르는 조회수도 한 번만 오른다. 보이는 화면이 받으면 바로 다시 읽는다.
 */
export function BlockChangeWatcher() {
  useEffect(() => {
    // 가려진 동안 받은 메시지가 있는지 — 다시 보일 때 한 번만 다시 읽는다.
    let pending = false;
    // 마지막으로 반영한 웹 차단 표시 — 이 화면이 뜬 뒤의 표시만 본다(뜰 때 이미 서버 기준으로 그렸다).
    let seenAt = readBlockChangedAt();

    function reload() {
      pending = false;
      seenAt = Math.max(seenAt, readBlockChangedAt());
      window.dispatchEvent(new Event(BLOCK_CHANGED_EVENT));
    }

    function handleVisible() {
      if (document.visibilityState !== "visible") return;
      if (pending || readBlockChangedAt() > seenAt) reload();
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === BLOCK_CHANGED_AT_KEY) handleVisible();
    }

    function handleMarkedHere(event: Event) {
      const at = (event as CustomEvent<number>).detail;
      seenAt = Math.max(seenAt, at);
    }

    const unregister = registerWebBridge((message) => {
      if (message.type !== InboundMessageType.USER_BLOCK_CHANGED) return;

      pending = true;
      handleVisible();
    });
    document.addEventListener("visibilitychange", handleVisible);
    window.addEventListener("pageshow", handleVisible);
    window.addEventListener(BLOCK_MARKED_HERE_EVENT, handleMarkedHere);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleVisible);
    document.addEventListener("pointerdown", handleVisible, {
      capture: true,
      passive: true,
    });

    return () => {
      unregister();
      document.removeEventListener("visibilitychange", handleVisible);
      window.removeEventListener("pageshow", handleVisible);
      window.removeEventListener(BLOCK_MARKED_HERE_EVENT, handleMarkedHere);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleVisible);
      document.removeEventListener("pointerdown", handleVisible, {
        capture: true,
      });
    };
  }, []);

  return null;
}

/** 앱에서 차단이 바뀌었을 때 부른다 — 차단을 그리는 화면(피드 · 댓글 목록)이 각자 다시 읽는 용도. */
export function useOnBlockChange(callback: () => void): void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    function handle() {
      callbackRef.current();
    }
    window.addEventListener(BLOCK_CHANGED_EVENT, handle);
    return () => window.removeEventListener(BLOCK_CHANGED_EVENT, handle);
  }, []);
}
