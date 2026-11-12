"use client";

import { useRef, useState } from "react";

import { useIsDemoMode } from "@/features/community/presentation/community-demo-context";
import { bffFetch } from "@/shared/lib/http/bff-fetch";
import { OutboundMessageType, postToNative } from "@/shared/lib/native-bridge";

/**
 * 게시글 좋아요/북마크 낙관적(optimistic) 토글 훅.
 *
 * 서버에서 받은 초기 상태(liked/bookmarked + counts)를 들고, 토글 시 즉시 UI를 반영한 뒤
 * BFF로 요청한다. 실패하면 이전 상태로 롤백한다. 401(비로그인)이면 네이티브 로그인 유도.
 *
 * 쓰기 흐름은 컨벤션의 정본 경로(Browser → app/api → application → infrastructure)를 따른다.
 *
 * 시드가 바뀌면 상태를 다시 맞춘다 — 목록이 서버에서 게시글을 다시 읽어 갈아끼우는 경로(#73)가
 * 생겼기 때문. 카드는 id가 같아 재마운트되지 않으므로, 시드만 새로 들어오고 useState는 최초값을
 * 붙들고 있어 좋아요·저장이 옛 값으로 남는다.
 */

/** 훅 시드값. saves는 목록·상세 응답의 saveCount로 채워지고, 미제공이면 0으로 시드한다. */
type PostActionsSeed = {
  liked: boolean;
  bookmarked: boolean;
  likes: number;
  saves?: number;
};

type PostActionsState = {
  liked: boolean;
  bookmarked: boolean;
  likes: number;
  saves: number;
};

type ToggleKind = "like" | "bookmark";

const ENDPOINT: Record<ToggleKind, (postId: number) => string> = {
  like: (postId) => `/api/community/posts/${postId}/likes`,
  bookmark: (postId) => `/api/community/posts/${postId}/bookmarks`,
};

export function usePostActions(postId: number, initial: PostActionsSeed) {
  const demo = useIsDemoMode();
  const [state, setState] = useState<PostActionsState>(() => toState(initial));
  // 종류별 서버 동기화 진행 중 플래그 — 진행 중엔 시드로 상태를 되돌리지 않는다.
  const [pending, setPending] = useState<Record<ToggleKind, boolean>>({
    like: false,
    bookmark: false,
  });

  // 렌더 중 상태 조정(React 공식 "props 변경 시 state 리셋" 패턴) — effect로 하면 옛 값이 한 번
  // 그려진 뒤 덮여 깜빡인다. 진행 중인 토글이 있으면 화면 상태는 건드리지 않는다(낙관적 반영을 되돌리지 않도록).
  // 기준 시드는 진행 중에도 갱신한다 — 안 그러면 요청이 끝난 뒤 그사이 받은 낡은 시드로 화면이 되돌아간다.
  const [seed, setSeed] = useState(initial);
  if (!isSameSeed(seed, initial)) {
    setSeed(initial);
    if (!pending.like && !pending.bookmark) setState(toState(initial));
  }

  // 연타 대응 — 탭마다 화면은 바로 뒤집고, 서버 요청은 종류별로 한 번에 하나씩만 보낸다.
  // 요청이 끝났을 때 화면(마지막 탭) 상태와 서버 상태가 다르면 한 번 더 보내 맞춘다.
  // desiredRef: 사용자가 마지막으로 원한 상태. inFlightRef: 종류별 동기화 루프가 도는 중인지.
  const desiredRef = useRef<Record<ToggleKind, boolean>>({ like: false, bookmark: false });
  const inFlightRef = useRef<Record<ToggleKind, boolean>>({ like: false, bookmark: false });

  function toggle(kind: ToggleKind) {
    const wasActive = kind === "like" ? state.liked : state.bookmarked;
    const nextActive = !wasActive;

    // 1) 낙관적 반영 — 진행 중인 요청이 있어도 탭은 버리지 않는다.
    desiredRef.current[kind] = nextActive;
    setState((prev) => applyToggle(prev, kind, nextActive));

    // 예시(데모)에선 네트워크 없이 낙관적 UI만 유지(롤백 없음).
    if (demo) return;

    // 이미 동기화 중이면 루프가 끝나기 전에 마지막 상태를 확인해 이어서 보낸다.
    if (inFlightRef.current[kind]) return;
    void sync(kind, wasActive);
  }

  /**
   * 서버 상태를 화면의 마지막 상태로 맞춘다. like/bookmark 모두 단일 엔드포인트 토글이라 항상 POST.
   * 응답이 왔을 때 그 사이 탭이 더 들어와 있으면(서버 ≠ 화면) 응답값으로 화면을 덮지 않고 다시 보낸다.
   */
  async function sync(kind: ToggleKind, startServerActive: boolean) {
    inFlightRef.current[kind] = true;
    setPending((p) => ({ ...p, [kind]: true }));
    let serverActive = startServerActive;

    try {
      while (desiredRef.current[kind] !== serverActive) {
        // 응답이 오지 않으면 루프가 영원히 막혀 이후 탭이 서버로 가지 않는다 — 15초 뒤 실패로 보고 되돌린다.
        const response = await bffFetch(ENDPOINT[kind](postId), {
          method: "POST",
          signal: AbortSignal.timeout(15_000),
        });

        if (!response.ok) {
          if (response.status === 401) {
            // 비로그인 → 네이티브 로그인 유도(소프트)
            postToNative({ type: OutboundMessageType.AUTH_LOGIN_PROMPT });
          }
          throw new Error(`${kind} request failed: ${response.status}`);
        }

        // 서버 권위값(like=data.liked + data.likeCount, bookmark=data.saved + data.saveCount).
        const data = (
          (await response.json().catch(() => null)) as {
            data?: {
              liked?: boolean;
              likeCount?: number;
              saved?: boolean;
              saveCount?: number;
            };
          } | null
        )?.data;
        const authoritative = kind === "like" ? data?.liked : data?.saved;
        const before = serverActive;
        serverActive = typeof authoritative === "boolean" ? authoritative : !serverActive;

        // 토글했는데 서버 상태가 그대로면 더 보내도 수렴하지 않는다 — 서버 값을 정답으로 삼고 멈춘다.
        if (serverActive === before) desiredRef.current[kind] = serverActive;

        // 사이에 탭이 더 들어왔으면 낡은 응답으로 화면을 덮지 않고 한 번 더 보낸다.
        if (desiredRef.current[kind] !== serverActive) continue;

        // 화면과 서버가 같아졌다 — 카운트는 서버가 토글 직후 값을 내려주므로 그대로 확정한다.
        // 로컬 ±1은 요청 사이에 끼어든 다른 사용자의 토글을 놓쳐 실제 값과 어긋난다.
        const serverCount = kind === "like" ? data?.likeCount : data?.saveCount;
        const settled = serverActive;
        setState((prev) => {
          const next = applyToggle(prev, kind, settled);
          if (typeof serverCount !== "number") return next;
          return kind === "like"
            ? { ...next, likes: Math.max(0, serverCount) }
            : { ...next, saves: Math.max(0, serverCount) };
        });
      }
    } catch {
      // 2) 실패 시 마지막으로 확인된 서버 상태로 롤백
      desiredRef.current[kind] = serverActive;
      const settled = serverActive;
      setState((prev) => applyToggle(prev, kind, settled));
    } finally {
      inFlightRef.current[kind] = false;
      setPending((p) => ({ ...p, [kind]: false }));
    }
  }

  return {
    liked: state.liked,
    bookmarked: state.bookmarked,
    likes: state.likes,
    saves: state.saves,
    toggleLike: () => toggle("like"),
    toggleBookmark: () => toggle("bookmark"),
  };
}

/** 시드 → 내부 상태. saves는 미제공(상세) 시 0으로 정규화한다. */
function toState(seed: PostActionsSeed): PostActionsState {
  return { ...seed, saves: seed.saves ?? 0 };
}

/** 시드가 실제로 달라졌는지 값으로 비교한다(매 렌더 새 객체가 만들어지므로 참조 비교 불가). */
function isSameSeed(a: PostActionsSeed, b: PostActionsSeed): boolean {
  return (
    a.liked === b.liked &&
    a.bookmarked === b.bookmarked &&
    a.likes === b.likes &&
    a.saves === b.saves
  );
}

/**
 * 종류별 상태를 보정한다 — active 플래그와 해당 카운트를 함께 움직인다.
 * 이미 그 상태면 그대로 둔다(롤백·확정이 카운트를 두 번 움직이지 않도록).
 */
function applyToggle(
  prev: PostActionsState,
  kind: ToggleKind,
  nextActive: boolean,
): PostActionsState {
  const current = kind === "like" ? prev.liked : prev.bookmarked;
  if (current === nextActive) return prev;

  const delta = nextActive ? 1 : -1;

  if (kind === "like") {
    return { ...prev, liked: nextActive, likes: prev.likes + delta };
  }

  // 카운트는 0 미만으로 내려가지 않게 방어(saveCount 미제공으로 0에서 시드된 글을 해제 토글할 때).
  return {
    ...prev,
    bookmarked: nextActive,
    saves: Math.max(0, prev.saves + delta),
  };
}
