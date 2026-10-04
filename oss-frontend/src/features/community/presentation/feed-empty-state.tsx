"use client";

import { EmptyState } from "@/features/community/presentation/empty-state";
import { useOpenPostWrite } from "@/features/community/presentation/use-open-post-write";

/**
 * 메인 피드 빈 상태 — 안내 문구 + 글쓰기 진입 버튼(화면 중앙).
 *
 * 게시글이 하나도 없을 때 노출한다. 글쓰기 버튼은 FAB(PostWriteFab)과 동일하게
 * useOpenPostWrite로 작성 화면을 연다(네이티브면 서브뷰, 웹이면 라우터 이동).
 * 모양은 공통 EmptyState가 그린다.
 */
export function FeedEmptyState() {
  const openWrite = useOpenPostWrite();

  return (
    // 세로 위치: 디자인 프레임(643) 기준 상단 225 → 약 35%. 가운데 정렬 대신 pt로 내려 배치.
    <EmptyState
      title="아직 등록된 글이 없어요"
      description="가장 먼저 글을 작성해보세요!"
      action={{ label: "글쓰기", onClick: openWrite }}
      className="min-h-screen pt-[35vh]"
    />
  );
}
