"use client";

import { useState } from "react";

import {
  MenuBox,
  MenuItem,
} from "@/features/community/presentation/menu-box";
import { AppBarShell, ConfirmDialog, useToast } from "@/shared/ui";
import {
  BellIcon,
  BellOffIcon,
  MoreVerticalIcon,
} from "@/shared/ui/icons";

/**
 * 상세 화면 상단 앱바 (클라이언트 leaf).
 *
 * 높이 44 고정, 하단 디바이더 없음, 배경 True White.
 * 우측: 알림종 + ⋮ 메뉴를 간격 0으로 붙여 우측 정렬(우 8). 뒤로가기는 네이티브 내비게이션이 담당.
 * 제목은 현재 비워둔다(추후 노출 시 가운데 영역에 추가).
 *
 * ⋮ 메뉴는 게시글 소유자 여부(isOwner)에 따라 수정/삭제 vs 신고를 노출하므로 웹이 소유한다
 * (네이티브가 그리면 소유자 컨텍스트를 브릿지로 왕복해야 함).
 */
export function PostDetailAppBar({
  isOwner,
  initialNoticeEnabled,
}: {
  isOwner: boolean;
  initialNoticeEnabled: boolean;
}) {
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  // 알림 받기 on/off. 초기값은 게시글의 noticeEnabled, 탭하면 토글(아이콘 변경 + 토스트).
  // FIXME: 실제 알림 설정 저장(PATCH)은 API 확정 후 추가.
  const [alarmOn, setAlarmOn] = useState(initialNoticeEnabled);

  // 네이티브 뒤로가기: 상세는 이탈 가드가 없어 BACK_GUARD를 통지하지 않는다 → 네이티브가 직접 닫는다.
  // (정상/에러 어느 화면이든 네이티브가 처리하므로 웹 측 back 코드가 필요 없다.)

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

  return (
    <AppBarShell>
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
    </AppBarShell>
  );
}
