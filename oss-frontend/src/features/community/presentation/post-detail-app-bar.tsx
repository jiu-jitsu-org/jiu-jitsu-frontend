"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { cn } from "@/shared/lib/cn";
import {
  closeNativeSubview,
  isNativeBridgeAvailable,
} from "@/shared/lib/native-bridge";
import { BackArrowIcon, BellIcon, MoreVerticalIcon } from "@/shared/ui/icons";

/**
 * 상세 화면 상단 앱바 (클라이언트 leaf).
 *
 * 높이 44 고정, 하단 디바이더 없음, 배경 True White.
 * 좌측: 뒤로가기(좌 8). 우측: 알림종 + ⋮ 메뉴를 간격 0으로 붙여 우측 정렬(우 8).
 * 제목은 현재 비워둔다(추후 노출 시 가운데 영역에 추가).
 *
 * ⋮ 메뉴는 게시글 소유자 여부(isOwner)에 따라 수정/삭제 vs 신고를 노출하므로 웹이 소유한다
 * (네이티브가 그리면 소유자 컨텍스트를 브릿지로 왕복해야 함).
 */
export function PostDetailAppBar({ isOwner }: { isOwner: boolean }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  function goBack() {
    // 네이티브 서브뷰(풀 웹뷰)면 CLOSE_SUBVIEW로 네이티브가 pop → 리스트 웹뷰로 복귀.
    if (isNativeBridgeAvailable()) {
      closeNativeSubview();
      return;
    }
    // 웹 단독: history가 있으면 뒤로, 없으면(딥링크 진입 등) 커뮤니티 목록으로.
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/community");
  }

  return (
    <header className="sticky top-0 z-30 flex h-11 items-center bg-[var(--bw-true-white)] px-2">
      <button
        type="button"
        onClick={goBack}
        aria-label="뒤로 가기"
        className="inline-flex size-10 items-center justify-center text-icon-primary"
      >
        <BackArrowIcon size={24} />
      </button>

      {/* 우측 그룹: 알림종 + ⋮ 를 간격 0으로 붙여 우측 정렬 */}
      <div className="ml-auto flex items-center">
        <button
          type="button"
          aria-label="알림"
          className="inline-flex size-10 items-center justify-center text-icon-primary"
        >
          <BellIcon size={24} />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="게시물 메뉴 열기"
            className="inline-flex size-10 items-center justify-center text-icon-primary"
          >
            <MoreVerticalIcon size={24} />
          </button>

        {menuOpen ? (
          <>
            <button
              type="button"
              aria-label="메뉴 닫기"
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-10 cursor-default"
            />
            <ul
              role="menu"
              className="absolute right-0 z-20 mt-1 min-w-28 overflow-hidden rounded-xl border border-border-default bg-surface-container py-1 shadow-lg"
            >
              {isOwner ? (
                <>
                  <MenuItem label="수정" onClick={() => setMenuOpen(false)} />
                  <MenuItem
                    label="삭제"
                    destructive
                    onClick={() => setMenuOpen(false)}
                  />
                </>
              ) : (
                <MenuItem label="신고" onClick={() => setMenuOpen(false)} />
              )}
            </ul>
          </>
        ) : null}
        </div>
      </div>
    </header>
  );
}

/**
 * FIXME: 수정/삭제/신고 동작은 각 API 스펙 확정 후 연결(현재 메뉴 닫기만).
 */
function MenuItem({
  label,
  onClick,
  destructive = false,
}: {
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <li role="menuitem">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "block w-full px-4 py-2 text-left text-sm",
          destructive ? "text-error" : "text-text-secondary",
        )}
      >
        {label}
      </button>
    </li>
  );
}
