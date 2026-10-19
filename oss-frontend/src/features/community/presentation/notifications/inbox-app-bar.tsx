"use client";

import { AppBarShell } from "@/features/community/presentation/app-bar-shell";
import { closeDetail } from "@/features/community/presentation/close-detail";
import { ChevronLeftIcon } from "@/shared/ui/icons";

/**
 * 알림함 앱바 (클라이언트 leaf) — 뒤로가기 / "알림함" / "모두 읽음".
 *
 * 앱에서는 종 아이콘이 이 화면을 서브뷰로 열어 뒤로가기는 네이티브 팝이고, 웹 단독이면 히스토리를
 * 되돌린다 — 내 커뮤니티 활동 앱바와 같은 경로(closeDetail)다.
 *
 * 디자인: safe-area 아래 12 여백 + 바 40 · 좌우 16. 좌우 버튼(36)은 바 위쪽에 붙여 아래 여백 4가 남는다.
 *
 * "모두 읽음"은 안 읽은 알림이 없으면 회색 비활성이다(누를 이유가 없는 버튼을 막는다).
 */
export function InboxAppBar({
  canMarkAllRead,
  onMarkAllRead,
}: {
  canMarkAllRead: boolean;
  onMarkAllRead: () => void;
}) {
  return (
    <AppBarShell className="h-10 items-start px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
      {/* 좌측 뒤로가기 — 터치 영역 = 둥근 사각(36). */}
      <button
        type="button"
        onClick={closeDetail}
        aria-label="뒤로 가기"
        className="inline-flex size-9 items-center justify-center rounded-[10px] bg-button-tint-default-bg text-button-tint-default-text"
      >
        <ChevronLeftIcon size={20} />
      </button>

      {/* 제목: 바(40) 위 1 여백 + 글자 영역 35. 좌우 버튼 탭을 가리지 않게 pointer-events-none. */}
      <h1 className="pointer-events-none absolute inset-x-0 bottom-0 flex h-10 justify-center pt-px">
        <span className="flex h-[35px] items-center text-title-3 text-header-text">
          알림함
        </span>
      </h1>

      <button
        type="button"
        onClick={onMarkAllRead}
        disabled={!canMarkAllRead}
        className="ml-auto inline-flex h-9 w-[61px] items-center justify-center text-button-s text-button-text-default-text disabled:text-button-text-disabled-text"
      >
        모두 읽음
      </button>
    </AppBarShell>
  );
}
