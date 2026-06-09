"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  MenuBox,
  MenuItem,
} from "@/features/community/presentation/menu-box";
import {
  closeNativeSubview,
  isNativeBridgeAvailable,
} from "@/shared/lib/native-bridge";
import { ConfirmDialog, useToast } from "@/shared/ui";
import {
  BackArrowIcon,
  BellIcon,
  BellOffIcon,
  MoreVerticalIcon,
} from "@/shared/ui/icons";

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
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  // 알림 받기 on/off. 디폴트 on, 탭하면 off로 토글(아이콘 변경 + 토스트).
  // FIXME: 실제 알림 설정 저장/연동은 API 확정 후 추가.
  const [alarmOn, setAlarmOn] = useState(true);

  function toggleAlarm() {
    const next = !alarmOn;
    setAlarmOn(next);
    toast.show(
      next ? "이제부터 이 글의 알림을 받아요" : "이제부터 이 글의 알림을 받지 않아요",
    );
  }

  function confirmDelete() {
    setDeleteConfirmOpen(false);
    // FIXME(API): 게시글 삭제(post id) + 성공 시 화면 닫기/목록 복귀.
    toast.show("게시물이 삭제되었습니다");
  }

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
          onClick={toggleAlarm}
          aria-label={alarmOn ? "알림 끄기" : "알림 켜기"}
          aria-pressed={alarmOn}
          className="inline-flex size-10 items-center justify-center text-icon-primary"
        >
          {alarmOn ? <BellIcon size={24} /> : <BellOffIcon size={24} />}
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
          <MenuBox placement="bottom-right" onClose={() => setMenuOpen(false)}>
            {/* 자신 게시글: 삭제/수정 · 타인 게시글: 신고/숨기기 */}
            {isOwner ? (
              <>
                <MenuItem
                  onClick={() => {
                    setMenuOpen(false);
                    setDeleteConfirmOpen(true);
                  }}
                >
                  삭제하기
                </MenuItem>
                <MenuItem onClick={() => setMenuOpen(false)}>수정하기</MenuItem>
              </>
            ) : (
              <>
                <MenuItem onClick={() => setMenuOpen(false)}>신고하기</MenuItem>
                <MenuItem onClick={() => setMenuOpen(false)}>숨기기</MenuItem>
              </>
            )}
          </MenuBox>
        ) : null}
        </div>
      </div>

      {/* 게시글 삭제 확인 알럿 */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="게시글 삭제"
        message="삭제한 게시글은 복구할 수 없어요."
        confirmText="삭제"
        destructive
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
      />
    </header>
  );
}
