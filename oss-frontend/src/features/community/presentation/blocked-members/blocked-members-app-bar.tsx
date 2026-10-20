"use client";

import { AppBarShell } from "@/features/community/presentation/app-bar-shell";
import { closeDetail } from "@/features/community/presentation/close-detail";
import { cn } from "@/shared/lib/cn";
import { BackArrowIcon } from "@/shared/ui/icons";
import { ICON_BUTTON_PRESS } from "@/shared/ui/press-styles";

/**
 * 차단한 회원 앱바 (클라이언트 leaf) — 내 커뮤니티 활동 앱바(MyActivityAppBar)와 같은 규격.
 *
 * 앱 설정에서 서브뷰(OPEN_SUBVIEW)로 열리므로 뒤로가기는 closeDetail(앱이면 네이티브 팝,
 * 웹 단독이면 히스토리 되돌리기)이다. 제목은 가운데 고정이고 메뉴는 없다.
 */
export function BlockedMembersAppBar() {
  return (
    // 배경은 화면 바탕(--bw-white)에 맞춘다 — 셸 기본(true white)이면 앱바 아래로 옅은 띠가 생긴다.
    <AppBarShell className="bg-[var(--bw-white)]">
      <button
        type="button"
        onClick={closeDetail}
        aria-label="뒤로 가기"
        className={cn(
          "inline-flex size-10 items-center justify-center text-icon-primary",
          ICON_BUTTON_PRESS,
        )}
      >
        <BackArrowIcon size={24} />
      </button>

      {/* 제목: Body M · semibold, 바(44) 기준 가운데. 뒤로가기 탭을 가리지 않게 pointer-events-none. */}
      <h1 className="pointer-events-none absolute inset-x-0 bottom-0 flex h-11 items-center justify-center text-body-m font-semibold text-header-text">
        차단한 회원
      </h1>
    </AppBarShell>
  );
}
