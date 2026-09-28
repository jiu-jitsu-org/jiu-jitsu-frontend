"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { POST_EDITED_ACTION } from "@/features/community/presentation/post-edit-return";
import { type PendingToastAction, usePendingToast } from "@/shared/ui";

/**
 * 상세로 돌아왔을 때 남겨진 토스트를 띄우고, 이 글을 수정하고 온 것이면 내용을 다시 읽는다(#157).
 *
 * WHY 상세가 직접 받는가: 상세 ⋮ → 수정 성공은 새 상세를 쌓지 않고 원래 상세로 돌아온다(뒤로가기 1번 유지).
 * 앱에서는 수정 화면이 별도 웹뷰라 닫히면서 띄운 토스트가 함께 사라지고(#98과 같은 실패 모드),
 * 드러난 상세는 서버 렌더 그대로라 수정 전 내용이다 — 그래서 문구와 갱신 신호를 남기고 상세가 소비한다.
 * 웹 단독(router.back)도 라우터 캐시의 옛 상세가 복원되므로 같은 갱신이 필요하다.
 *
 * 그리는 것이 없는 leaf — 서버 컴포넌트인 PostDetailView에 훅을 걸 자리가 없어 분리했다.
 */
export function PostDetailReturnListener({ postId }: { postId: number }) {
  const router = useRouter();

  const handleConsume = useCallback(
    (action: PendingToastAction) => {
      if (action.type !== POST_EDITED_ACTION || action.postId !== postId) {
        return;
      }
      router.refresh();
    },
    [postId, router],
  );

  usePendingToast(handleConsume);
  return null;
}
