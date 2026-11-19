"use client";

import { bffFetch } from "@/shared/lib/http/bff-fetch";
import { requestNativeLogin } from "@/shared/lib/native-bridge";

/**
 * 게시글 숨김 토글.
 *
 * 업스트림 `PUT /board/hide/{id}`가 단일 엔드포인트 토글이라 같은 호출이 숨김과 해제를 겸한다
 * — 되돌리기가 별도 API 없이 성립하는 이유다.
 *
 * 목록 카드 ⋮와 상세 앱바 ⋮가 같은 동작을 하므로 호출을 한곳에 모은다. 토스트·화면 전환처럼
 * 진입 지점마다 다른 후처리는 호출부가 맡는다(목록은 카드 제거, 상세는 화면 닫기).
 *
 * 토글이라 누른 결과가 숨김인지 풀림인지는 응답(hidden)으로만 안다 — 이미 숨긴 글을 저장 목록 · 링크로 열고
 * 다시 누르면 숨김이 풀린다(#530). 호출부는 이 값으로 안내와 후처리를 가른다.
 *
 * @returns 토글 뒤 숨김 상태. 실패면 null — 401이면 네이티브 로그인 유도까지 한다.
 */
export async function toggleHidePost(postId: number): Promise<boolean | null> {
  const response = await bffFetch(`/api/community/posts/${postId}/hide`, {
    method: "POST",
  }).catch(() => null);

  if (!response?.ok) {
    if (response?.status === 401) {
      requestNativeLogin("session_expired");
    }
    return null;
  }

  const body = (await response.json().catch(() => null)) as {
    data?: { hidden?: unknown };
  } | null;
  const hidden = body?.data?.hidden;
  return typeof hidden === "boolean" ? hidden : null;
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
  done: "게시글을 숨겼어요",
  /** 이미 숨긴 글에서 숨기기를 눌러 풀린 경우(#530) — 화면을 닫거나 카드를 걷지 않는다. */
  unhidden: "숨김을 풀었어요",
  undoLabel: "되돌리기",
  failed: "게시글을 숨기지 못했어요",
  undoFailed: "되돌리지 못했어요",
} as const;
