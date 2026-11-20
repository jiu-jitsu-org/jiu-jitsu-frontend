"use client";

import { useEffect, useState, type ReactNode } from "react";

import type { ErrorShownDetail } from "@/shared/lib/analytics";
import { useToast } from "@/shared/ui";

type Props = {
  /** 어느 상세인지(게시글 id · 밸런스 contentId). 다른 상세로 바뀌면 보던 화면을 쓰지 않는다. */
  contentId: number;
} & (
  | { ok: true; children: ReactNode; fallback?: never }
  | {
      ok: false;
      fallback: ReactNode;
      children?: never;
      /** 실패 토스트의 오류 기록(#583)에 실을 상태 · 코드 · 대상 종류. */
      error?: ErrorShownDetail;
    }
);

/**
 * 상세를 다시 그리다(router.refresh) 조회가 실패해도 보던 화면을 지킨다(#493).
 *
 * 상세는 서버 컴포넌트가 조회하므로 댓글 등록 · 삭제 · 신고 · 차단, 로그인 전환, 앱에서 차단이 바뀜(#488)마다
 * 서버 렌더를 다시 돌린다. 그때 조회가 5xx · 타임아웃이면 화면 전체가 오류 화면으로 바뀌는데, 상세에는 웹
 * 헤더가 없고 앱은 이미 PAGE_READY를 받아 네이티브 뒤로가기를 숨긴 뒤라 빠져나갈 길이 재시도뿐이다.
 *
 * 서버 컴포넌트는 지금이 처음 여는 것인지 다시 그리는 것인지 모르므로, 같은 자리에 늘 이 컴포넌트를 두고
 * 성공이면 그린 화면을 기억해 두었다가 실패가 오면 그 화면을 그대로 그리고 토스트로만 알린다.
 * 기억한 화면이 없으면(처음 열기 · 다른 상세) 지금처럼 오류 화면(fallback)이다.
 * 만료(A0003) · 열 수 없는 글(404)은 서버 컴포넌트가 이 컴포넌트를 거치지 않고 지금처럼 분기한다.
 *
 * 기억한 화면은 같은 요소를 같은 자리에 다시 그리는 것이라 안쪽 클라이언트 상태(쓰던 댓글 · 펼친 답글 ·
 * 스크롤)도 그대로 남는다.
 */
export function KeepDetailOnRefreshFailure(props: Props) {
  const { contentId } = props;
  const toast = useToast();
  const [last, setLast] = useState<{ contentId: number; view: ReactNode } | null>(
    null,
  );
  // 성공한 화면을 기억한다 — 렌더 중에 바로 맞춰 실패가 오는 그 렌더에서 쓸 수 있게 한다.
  if (props.ok && (last?.contentId !== contentId || last.view !== props.children)) {
    setLast({ contentId, view: props.children });
  }
  const kept = !props.ok && last?.contentId === contentId ? last.view : null;

  // 서버가 실패를 새로 보낼 때마다(fallback 요소가 새로 옴) 한 번 알린다. 다른 이유로 다시 그려질 때는 그대로다.
  const failure = props.ok ? null : props.fallback;
  const failureError = props.ok ? undefined : props.error;
  const keeping = kept !== null;
  useEffect(() => {
    if (failure === null || !keeping) return;
    toast.show("새로 불러오지 못했어요. 잠시 후 다시 시도해 주세요", {
      tone: "error",
      error: failureError,
    });
    // toast는 Provider가 주는 값이라 다시 알릴 이유가 아니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [failure, keeping]);

  if (props.ok) return props.children;
  return kept ?? props.fallback;
}
