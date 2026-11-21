"use client";

import { AppBarShell } from "@/features/community/presentation/app-bar-shell";
import { closeDetail } from "@/features/community/presentation/close-detail";
import { IconButton } from "@/shared/ui/icon-button";
import { BackArrowIcon } from "@/shared/ui/icons";

/**
 * 홈 목록을 앱 서브뷰로 열었을 때(`?view=subview`)의 앱바 — 뒤로가기만.
 *
 * 글 상세의 카테고리 이름(PostCategoryLink)이 홈 목록을 그 카테고리 탭으로 서브뷰에 쌓는다. 서브뷰는 앱 머리 없이
 * 웹뷰를 화면 끝까지 그리므로, 이 바가 상태바 자리(safe-area)를 비우고 돌아갈 길을 둔다.
 * 제목은 두지 않는다 — 바로 아래 탭 줄이 고른 카테고리를 이미 보여 준다. 규격은 글 상세 앱바와 같다.
 */
export function HomeSubviewAppBar() {
  return (
    // 배경은 화면 바탕(피드와 같은 색) — 셸 기본(true white)이면 앱바 아래로 옅은 띠가 생긴다.
    <AppBarShell className="bg-surface-container">
      <IconButton data-ga="back" onClick={closeDetail} aria-label="뒤로 가기">
        <BackArrowIcon size={24} />
      </IconButton>
    </AppBarShell>
  );
}
