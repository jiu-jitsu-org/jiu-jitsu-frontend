"use client";

import { useCallback, useRef } from "react";

import type {
  InboxGoneKind,
  InboxNotification,
} from "@/features/community/domain/inbox-notification";
import { bffFetch } from "@/shared/lib/http/bff-fetch";

/**
 * 게시글 확인을 기다리는 최대 시간(ms). 넘기면 확인을 포기하고 평소처럼 상세로 보낸다.
 *
 * dev 실측: 업스트림 GET /board/{id} 단독 0.3~0.4초. 그 위에 BFF 한 번을 더해도 이 안에 든다.
 * 늦어져도 상세(PostDetailGone)가 삭제를 다시 걸러 주므로, 탭이 멈춰 있는 것보다 넘어가는 편이 낫다.
 */
const PROBE_TIMEOUT_MS = 1500;

/**
 * 알림 셀을 탭했을 때 대상이 삭제됐는지 판단한다 (#187).
 *
 * 1. 서버가 알려준 값(notification.gone)이 있으면 그대로 쓴다 — backend#154가 오면 이것만 남는다.
 * 2. 없으면(지금은 항상) 임시로 게시글을 조회해 404면 "post"로 본다. 404는 삭제 · 신고 · 차단 · 숨김이
 *    모두 수렴하는 응답이라 상세(PostDetailGone)와 같은 문구로 안내한다.
 *
 * 임시 판단의 한계:
 * - 댓글 · 대댓글 삭제는 알 수 없다. 알림 응답에 댓글 id가 없어(data = 게시글 contentId) 무엇을 볼지조차 모른다.
 *   게시글이 살아 있으면 평소처럼 상세로 간다.
 * - 밸런스 게임 대상은 확인하지 않는다 — 알림함 문구가 없고 노출 여부도 기획 확인 중이라
 *   지금처럼 상세(BalanceDetailGone)가 처리한다.
 * - 게시글 단건 조회(GET /board/{id})는 조회수를 1 올린다(dev 실측). 살아 있는 글은 확인 1회 + 상세 1회로
 *   2가 오른다. 피드 복귀 재조회(use-feed-revalidate)와 같은 성질의 부작용이고, 서버 값이 오면 사라진다.
 * - 네트워크 실패 · 시간 초과 · 404 외 오류는 "모름"(null) — 상세로 보내 상세가 판단하게 둔다.
 *
 * 삭제로 판정된 게시글은 이 화면이 살아 있는 동안 기억해, 같은 셀을 다시 탭해도 바로 안내한다.
 * 살아 있다는 판정은 기억하지 않는다 — 다녀온 사이 지워질 수 있다.
 *
 * TODO(#187, backend#154): 서버 값이 생기면 probePostGone과 goneCache를 지우고 1만 남긴다.
 */
export function useResolveInboxGone() {
  const goneCache = useRef(new Set<number>());

  return useCallback(
    async (notification: InboxNotification): Promise<InboxGoneKind | null> => {
      if (notification.gone) return notification.gone;

      const { target } = notification;
      if (target?.kind !== "post") return null;
      if (goneCache.current.has(target.postId)) return "post";

      const gone = await probePostGone(target.postId);
      if (gone) goneCache.current.add(target.postId);
      return gone ? "post" : null;
    },
    [],
  );
}

/** 게시글 BFF 단건 조회가 404인지. 판단할 수 없으면 false(상세가 다시 거른다). */
async function probePostGone(postId: number): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    const response = await bffFetch(`/api/community/posts/${postId}`, {
      signal: controller.signal,
    });
    return response.status === 404;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
