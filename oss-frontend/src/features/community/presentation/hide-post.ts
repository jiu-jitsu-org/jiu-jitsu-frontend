"use client";

import { bffFetch } from "@/shared/lib/http/bff-fetch";
import { OutboundMessageType, postToNative } from "@/shared/lib/native-bridge";

/**
 * 게시글 숨김 토글.
 *
 * 업스트림 `PUT /board/hide/{id}`가 단일 엔드포인트 토글이라 같은 호출이 숨김과 해제를 겸한다
 * — 되돌리기가 별도 API 없이 성립하는 이유다.
 *
 * 목록 카드 ⋮와 상세 앱바 ⋮가 같은 동작을 하므로 호출을 한곳에 모은다. 토스트·화면 전환처럼
 * 진입 지점마다 다른 후처리는 호출부가 맡는다(목록은 카드 제거, 상세는 화면 닫기).
 *
 * @returns 성공 여부. 401이면 네이티브 로그인 유도까지 하고 false를 돌려준다.
 */
export async function toggleHidePost(postId: number): Promise<boolean> {
  const response = await bffFetch(`/api/community/posts/${postId}/hide`, {
    method: "POST",
  });

  if (!response.ok) {
    if (response.status === 401) {
      postToNative({ type: OutboundMessageType.AUTH_LOGIN_PROMPT });
    }
    return false;
  }

  return true;
}

/**
 * 상세에서 숨겼음을 목록에 알리는 액션 식별자 — 상세가 남기고 목록이 해석한다(pending-toast).
 *
 * WHY 서버 응답으로 알 수 없는가: 숨긴 게시글의 상세는 여전히 200 + 정상 데이터로 내려오고
 * 응답에 숨김 표시가 없다(실측). 목록 조회에서는 제외되지만, 복귀 시점에 이미 화면에 있는 카드를
 * 걷어내려면 목록이 "숨겨졌다"는 사실을 알아야 한다. 알 수 있는 쪽이 알려준다.
 *
 * 삭제 · 신고 · 차단은 상세가 404를 주므로 재조회만으로 판별된다(#73) — 숨김만 예외다.
 */
export const POST_HIDDEN_ACTION = "post-hidden";

/** 목록·상세가 공유하는 숨김 문구. 진입 지점에 따라 갈리면 안 된다. */
export const HIDE_TOAST = {
  done: "게시글을 숨겼습니다",
  undoLabel: "되돌리기",
  failed: "게시글을 숨기지 못했습니다",
  undoFailed: "되돌리지 못했습니다",
} as const;
