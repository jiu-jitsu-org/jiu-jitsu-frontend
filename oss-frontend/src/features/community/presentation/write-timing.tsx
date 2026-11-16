"use client";

import { useEffect } from "react";

/**
 * 글 등록 단계별 시간 로그 `[community-write]` (#486).
 *
 * 등록 버튼 → (사진 업로드 대기) → 글 생성 응답 → 상세 첫 렌더까지 각 단계가 얼마나 걸리는지
 * 콘솔에 남긴다 — 느린 원인이 사진 · 글 생성(BE) · 상세 서버 렌더 중 어디인지 나눠 보기 위함이다.
 * 글쓰기에서 상세로는 같은 문서 안의 클라이언트 이동이라 모듈 변수로 시작 시각을 넘긴다
 * (새로고침되면 기록은 없어지고 로그만 빠진다).
 */
let startedAt: number | null = null;
let pendingPostId: number | null = null;

function elapsed(): string {
  return startedAt === null ? "?" : `${Math.round(performance.now() - startedAt)}ms`;
}

/**
 * 등록 버튼을 누른 시점 — 사진 업로드를 기다렸다 이어서 등록하면 첫 탭부터 잰다.
 * 지난 글이 생성까지 갔는데 상세가 그려지지 않은 채 끝났으면(없는 글 화면 등) 그 기록은 버리고 새로 잰다.
 */
export function startWriteTiming() {
  if (startedAt !== null && pendingPostId === null) return;
  startedAt = performance.now();
  pendingPostId = null;
  console.info("[community-write] 등록 시작");
}

/** 중간 단계 기록. */
export function logWriteStep(step: string) {
  console.info(`[community-write] ${step}: +${elapsed()}`);
}

/** 등록 실패·취소 — 다음 등록을 새로 잰다. */
export function resetWriteTiming() {
  startedAt = null;
  pendingPostId = null;
}

/**
 * 글쓰기 화면이 닫힐 때 — 사진을 기다리다 나간 경우처럼 등록이 끝나지 않았으면 기록을 버린다.
 * 남겨 두면 다음 글이 이 시작 시각부터 재어 값이 틀린다. 생성에 성공해 상세로 가는 중이면 둔다.
 */
export function abandonWriteTiming() {
  if (pendingPostId === null) resetWriteTiming();
}

/** 글 생성 성공 — 이 글의 상세가 처음 그려질 때 마지막 기록을 남긴다. */
export function expectDetailFor(postId: number) {
  pendingPostId = postId;
}

/** 상세 로딩(스켈레톤)에 둔다 — 등록 뒤 스켈레톤이 바로 뜨는지 본다. 글 id는 아직 모른다. */
export function WriteTimingSkeletonMark() {
  useEffect(() => {
    if (pendingPostId === null) return;
    logWriteStep("상세 스켈레톤");
  }, []);
  return null;
}

/** 상세 화면에 둔다 — 방금 등록한 글의 상세가 처음 그려진 시점을 기록하고 끝낸다. */
export function WriteTimingReport({ postId }: { postId: number }) {
  useEffect(() => {
    if (pendingPostId !== postId) return;
    logWriteStep("상세 첫 렌더");
    resetWriteTiming();
  }, [postId]);
  return null;
}
