"use client";

import { AppBarShell } from "@/features/community/presentation/app-bar-shell";
import { closeDetail } from "@/features/community/presentation/close-detail";
import { BackArrowIcon } from "@/shared/ui/icons";

/**
 * 내 커뮤니티 활동 앱바 (클라이언트 leaf).
 *
 * 뒤로가기는 상세 앱바(PostDetailAppBar)와 같은 규격 · 같은 경로(closeDetail)다 — 이 화면도
 * 앱에서는 서브뷰로 열려 네이티브가 팝해야 하고, 웹 단독이면 히스토리를 되돌린다.
 * 제목은 가운데 고정이고 ⋮ 메뉴는 없다.
 */
export function MyActivityAppBar() {
  return (
    // 배경은 화면 바탕(--bw-white, 피드와 같은 색)에 맞춘다 — 셸 기본(true white)이면 앱바 아래로 옅은 띠가 생긴다.
    <AppBarShell className="bg-[var(--bw-white)]">
      {/* 좌측 뒤로가기 — 40x40, 아이콘 24, 배경 없음. 좌 8·세로 중앙은 셸이 담당. */}
      <button
        type="button"
        onClick={closeDetail}
        aria-label="뒤로 가기"
        className="inline-flex size-10 items-center justify-center text-icon-primary"
      >
        <BackArrowIcon size={24} />
      </button>

      {/* 제목: Body M · semibold, 바(44) 기준 가로·세로 가운데. 셸의 safe-area 패딩 아래 바에 맞추려고
          bottom-0 + h-11로 놓는다. 뒤로가기 탭을 가리지 않게 pointer-events-none. */}
      <h1 className="pointer-events-none absolute inset-x-0 bottom-0 flex h-11 items-center justify-center text-body-m font-semibold text-header-text">
        커뮤니티 활동
      </h1>
    </AppBarShell>
  );
}
