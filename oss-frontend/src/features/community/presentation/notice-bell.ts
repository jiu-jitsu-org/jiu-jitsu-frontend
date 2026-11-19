"use client";

import { useState } from "react";

import { useCommentReply } from "@/features/community/presentation/comment-reply-context";

/**
 * 글 · 밸런스 게임 상세 앱바 알림 종의 노출과 안내 문구 (#527).
 *
 * 종이 켜고 끄는 것은 '이 글에서 내가 받는 알림'이다. 서버가 보내는 알림은 글쓴이에게 가는 새 댓글
 * (밸런스 게임은 운영 콘텐츠라 없음)과 내 댓글에 달린 답글 · 좋아요뿐이라, 남의 글은 내가 댓글을 단 적이
 * 있어야 받을 알림이 생긴다. 댓글을 단 적 없는 남의 글에서는 종을 감춘다 — 켜 둬도 아무 알림이 오지 않는데
 * '이 글의 알림을 받아요'로 읽혀 기다리게 만든다.
 *
 * 남의 글 · 밸런스 게임 판정: 내 글이 아니면(isOwner=false) 같은 문구다.
 */

/**
 * 종을 보일지 — 내 글이거나, 이 글에 댓글을 단 적이 있거나(상세 응답 viewer.commented),
 * 이 화면에서 방금 댓글 · 답글을 달았으면 보인다.
 *
 * 방금 단 댓글은 등록 뒤 서버 렌더가 다시 돌아 commented가 true로 오지만, 그 사이에도 바로 보이도록
 * 입력 바가 알리는 방금 등록한 댓글(justPostedId)을 한 번 보면 이 화면이 닫힐 때까지 켜 둔다.
 */
export function useShowNoticeBell({
  isOwner,
  commented,
}: {
  isOwner: boolean;
  commented: boolean;
}): boolean {
  const { justPostedId } = useCommentReply();
  const [commentedHere, setCommentedHere] = useState(false);
  // 렌더 중 상태 조정 — 한 번 켜지면 되돌리지 않는다.
  if (justPostedId !== null && !commentedHere) setCommentedHere(true);
  return isOwner || commented || commentedHere;
}

/** 종을 누른 뒤 안내 — 저장이 확정된 상태 기준으로만 만든다. 내 글은 지금 문구 그대로다. */
export function noticeBellToast(enabled: boolean, isOwner: boolean): string {
  if (isOwner) {
    return enabled ? "이 글의 알림을 받아요" : "이 글의 알림을 받지 않아요";
  }
  return enabled
    ? "이 글에서 내 댓글의 답글·좋아요 알림을 받아요"
    : "이 글에서 내 댓글의 답글·좋아요 알림을 받지 않아요";
}
