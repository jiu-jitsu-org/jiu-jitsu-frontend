"use client";

import { useRouter } from "next/navigation";

import { entryPath, type ScreenFrom } from "@/shared/lib/analytics";
import { markPostDirty } from "@/features/community/presentation/dirty-posts";
import { POST_EDIT_FROM_DETAIL } from "@/features/community/presentation/post-edit-return";
import { isNativeBridgeAvailable, openNativeSubview } from "@/shared/lib/native-bridge";

/** 게시글 수정 화면 웹 경로. */
function postEditPath(postId: number): string {
  return `/community/${postId}/edit`;
}

/**
 * 게시글 수정 화면 열기 핸들러.
 *
 * 상세 열기(useOpenPostDetail)와 동일한 규칙 — 네이티브면 풀스크린 서브뷰로 push해 헤더/탭바를 덮고,
 * 웹 단독이면 같은 웹뷰에서 라우터 이동. 수정은 확인 알럿이 없으므로 브릿지 왕복도 필요 없다.
 *
 * from: 들어온 길(GA, #576 — `entryPath`). 주지 않으면 지금 화면 이름을 쓴다.
 * 상세 ⋮은 `POST_EDIT_FROM_DETAIL`("post_detail")을 넘긴다 — 이 값만은 앱 · 브라우저 모두 늘 주소에 실린다.
 * 수정 화면(서버)이 이 값으로 성공 뒤 원래 상세로 돌아갈지 정하기 때문이다(#157). 상세 화면에서 from 없이 열어도
 * 앱(지원 목록에 ANALYTICS_EVENT)에서는 기본값이 "post_detail"이라 돌아가는 쪽이 된다 — 상세에서 연 수정이니
 * 맞는 동작이지만, 돌아가기가 필요하면 기본값에 기대지 말고 늘 명시적으로 넘긴다.
 *
 * 여는 시점에 갱신 대상으로 기록한다 — 기록은 웹뷰 단위(sessionStorage)라 앱에서는 수정 화면이
 * 아니라 목록 웹뷰에서 남겨야 목록이 복귀 시 이 글을 다시 읽는다.
 */
export function useOpenPostEdit(from?: ScreenFrom) {
  const router = useRouter();

  return (postId: number) => {
    const path =
      from === POST_EDIT_FROM_DETAIL
        ? `${postEditPath(postId)}?from=${POST_EDIT_FROM_DETAIL}`
        : entryPath(postEditPath(postId), from);
    markPostDirty(postId);

    if (isNativeBridgeAvailable()) {
      // 동일 origin 절대경로로 전달 → 새 웹뷰가 세션 쿠키 공유.
      openNativeSubview(`${window.location.origin}${path}`);
      return;
    }

    router.push(path);
  };
}
