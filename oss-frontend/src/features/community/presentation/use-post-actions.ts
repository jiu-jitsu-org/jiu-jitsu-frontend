"use client";

import { useState } from "react";

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
 */

/** 훅 시드값. saves는 목록 응답(saveCount)에만 있어 미제공(상세)이면 0으로 시드한다. */
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
  const [state, setState] = useState<PostActionsState>({
    ...initial,
    saves: initial.saves ?? 0,
  });
  // 동시 토글 방지 — 종류별 진행 중 플래그.
  const [pending, setPending] = useState<Record<ToggleKind, boolean>>({
    like: false,
    bookmark: false,
  });

  async function toggle(kind: ToggleKind) {
    if (pending[kind]) return;

    const wasActive = kind === "like" ? state.liked : state.bookmarked;
    // 토글 전 카운트(서버 권위값 보정 시 기준점) — 카운트 재계산에 쓴다.
    const prevCount = kind === "like" ? state.likes : state.saves;

    // 1) 낙관적 반영 — like/bookmark 모두 단일 엔드포인트 토글이라 항상 POST.
    setPending((p) => ({ ...p, [kind]: true }));
    setState((prev) => applyToggle(prev, kind, !wasActive));

    // 예시(데모)에선 네트워크 없이 낙관적 UI만 유지(롤백 없음).
    if (demo) {
      setPending((p) => ({ ...p, [kind]: false }));
      return;
    }

    try {
      const response = await bffFetch(ENDPOINT[kind](postId), { method: "POST" });

      if (!response.ok) {
        if (response.status === 401) {
          // 비로그인 → 네이티브 로그인 유도(소프트)
          postToNative({ type: OutboundMessageType.AUTH_LOGIN_PROMPT });
        }
        throw new Error(`${kind} request failed: ${response.status}`);
      }

      // 서버 권위값으로 낙관적 상태를 보정한다(like=data.liked, bookmark=data.saved).
      const body = (await response.json().catch(() => null)) as
        | { data?: { liked?: boolean; saved?: boolean } }
        | null;
      const authoritative =
        kind === "like" ? body?.data?.liked : body?.data?.saved;
      if (typeof authoritative === "boolean") {
        // 토글 전 기준점에서 서버 진실값으로 카운트 재계산.
        const nextCount = Math.max(
          0,
          prevCount + (authoritative ? 1 : 0) - (wasActive ? 1 : 0),
        );
        setState((prev) =>
          kind === "like"
            ? { ...prev, liked: authoritative, likes: nextCount }
            : { ...prev, bookmarked: authoritative, saves: nextCount },
        );
      }
    } catch {
      // 2) 실패 시 롤백
      setState((prev) => applyToggle(prev, kind, wasActive));
    } finally {
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

/** 종류별 상태를 보정한다 — active 플래그와 해당 카운트를 함께 움직인다. */
function applyToggle(
  prev: PostActionsState,
  kind: ToggleKind,
  nextActive: boolean,
): PostActionsState {
  const delta = nextActive ? 1 : -1;

  if (kind === "like") {
    return { ...prev, liked: nextActive, likes: prev.likes + delta };
  }

  // 카운트는 0 미만으로 내려가지 않게 방어(시드가 0인 상세 화면에서 해제 토글 시).
  return {
    ...prev,
    bookmarked: nextActive,
    saves: Math.max(0, prev.saves + delta),
  };
}
