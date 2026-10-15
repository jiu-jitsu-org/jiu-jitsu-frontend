"use client";

import { AppBarShell } from "@/features/community/presentation/app-bar-shell";
import { closeDetail } from "@/features/community/presentation/close-detail";
import { BackArrowIcon } from "@/shared/ui/icons";

/**
 * 알림함 앱바 (클라이언트 leaf) — 뒤로가기 / "알림함" / "모두 읽음".
 *
 * 앱에서는 종 아이콘이 이 화면을 서브뷰로 열어 뒤로가기는 네이티브 팝이고, 웹 단독이면 히스토리를
 * 되돌린다 — 내 커뮤니티 활동 앱바와 같은 경로(closeDetail)다.
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
    <AppBarShell>
      {/* 좌측 뒤로가기 — 디자인은 옅은 파란 배경의 둥근 사각 버튼(36). 터치 영역은 40을 유지한다. */}
      <button
        type="button"
        onClick={closeDetail}
        aria-label="뒤로 가기"
        className="inline-flex size-10 items-center justify-center"
      >
        <span className="inline-flex size-9 items-center justify-center rounded-[10px] bg-primary-faint text-primary">
          <BackArrowIcon size={20} />
        </span>
      </button>

      {/* 제목: 바(44) 기준 가로·세로 가운데. 좌우 버튼 탭을 가리지 않게 pointer-events-none. */}
      <h1 className="pointer-events-none absolute inset-x-0 bottom-0 flex h-11 items-center justify-center text-body-m font-semibold text-header-text">
        알림함
      </h1>

      <button
        type="button"
        onClick={onMarkAllRead}
        disabled={!canMarkAllRead}
        className="ml-auto h-10 px-2 text-label-m font-medium text-primary disabled:text-text-secondary"
      >
        모두 읽음
      </button>
    </AppBarShell>
  );
}
