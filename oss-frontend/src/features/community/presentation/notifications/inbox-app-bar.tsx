"use client";

import { AppBarShell } from "@/features/community/presentation/app-bar-shell";
import { closeDetail } from "@/features/community/presentation/close-detail";
import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";
import { ChevronLeftIcon } from "@/shared/ui/icons";

/**
 * 알림함 앱바 (클라이언트 leaf) — 뒤로가기 / "알림함" / "모두 읽음".
 *
 * 앱에서는 종 아이콘이 이 화면을 서브뷰로 열어 뒤로가기는 네이티브 팝이고, 웹 단독이면 히스토리를
 * 되돌린다 — 내 커뮤니티 활동 앱바와 같은 경로(closeDetail)다.
 *
 * 디자인: safe-area 아래 12 여백 + 바 40 · 좌우 16. 좌우 버튼(36)은 바 위쪽에 붙여 아래 여백 4가 남는다.
 *
 * "모두 읽음"은 뒤로가기와 짝을 맞춘 연한 파랑 상자다 — 같은 높이(36) · 같은 틴트 색, 글자 14 Semibold.
 * 안 읽은 알림이 없으면 회색 비활성이다(누를 이유가 없는 버튼을 막는다).
 */
export function InboxAppBar({
  canMarkAllRead,
  onMarkAllRead,
  showBack = true,
}: {
  canMarkAllRead: boolean;
  /** 목록이 없는 분기(비로그인 · 세션 복구 · 에러)는 서버 컴포넌트가 그려 핸들러 없이 비활성으로 둔다. */
  onMarkAllRead?: () => void;
  /**
   * 로딩 스켈레톤은 뒤로가기를 그리지 않는다 — 앱은 그동안 자기 비상용 뒤로가기(좌 8 · 40)를 띄워,
   * 위치가 다른 이 버튼(좌 16 · 36)까지 있으면 둘이 어긋나 겹쳐 보인다(#452). 웹 단독은 브라우저 뒤로가기가 있다.
   */
  showBack?: boolean;
}) {
  return (
    <AppBarShell className="h-10 items-start px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
      {/* 좌측 뒤로가기 — 터치 영역 = 둥근 사각(36). */}
      {showBack ? (
        <IconButton
          variant="tint"
          size="s"
          onClick={closeDetail}
          aria-label="뒤로 가기"
        >
          <ChevronLeftIcon size={20} />
        </IconButton>
      ) : null}

      {/* 제목: 바(40) 위 1 여백 + 글자 영역 35. 좌우 버튼 탭을 가리지 않게 pointer-events-none. */}
      <h1 className="pointer-events-none absolute inset-x-0 bottom-0 flex h-10 justify-center pt-px">
        <span className="flex h-[35px] items-center text-title-3 text-header-text">
          알림함
        </span>
      </h1>

      <Button
        variant="tint"
        size="s"
        onClick={onMarkAllRead}
        disabled={!canMarkAllRead || !onMarkAllRead}
        className="ml-auto h-9 text-body-s font-semibold"
      >
        모두 읽음
      </Button>
    </AppBarShell>
  );
}
