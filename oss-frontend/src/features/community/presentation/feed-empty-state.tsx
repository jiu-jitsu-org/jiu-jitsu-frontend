"use client";

import { useOpenPostWrite } from "@/features/community/presentation/use-open-post-write";

/**
 * 메인 피드 빈 상태 — 안내 문구 + 글쓰기 진입 버튼(화면 중앙).
 *
 * 게시글이 하나도 없을 때 노출한다. 글쓰기 버튼은 FAB(PostWriteFab)과 동일하게
 * useOpenPostWrite로 작성 화면을 연다(네이티브면 서브뷰, 웹이면 라우터 이동).
 * 색상은 empty-state / button-neutral 토큰만 사용한다(하드코딩 색상 없음).
 */
export function FeedEmptyState() {
  const openWrite = useOpenPostWrite();

  return (
    // 세로 위치: 디자인 프레임(643) 기준 상단 225 → 약 35%. 가운데 정렬 대신 pt로 내려 배치.
    <div className="flex min-h-screen flex-col items-center px-6 pt-[35vh] text-center">
      {/* 제목: Body M(16 Medium) */}
      <p className="text-body-m text-empty-state-default-title-text">
        아직 등록된 글이 없어요
      </p>
      {/* 부제목: Body S(14 Medium), 제목과 간격 4 */}
      <p className="mt-1 text-body-s text-empty-state-default-description-text">
        가장 먼저 글을 작성해보세요!
      </p>
      {/* 글쓰기 버튼: 재시도 버튼과 동일한 neutral 규격(38/rounded 10/px16), 부제목과 간격 13 */}
      <button
        type="button"
        onClick={openWrite}
        className="mt-[13px] h-[38px] rounded-[10px] bg-button-neutral-default-bg px-4 text-button-m text-button-neutral-default-text"
      >
        글쓰기
      </button>
    </div>
  );
}
