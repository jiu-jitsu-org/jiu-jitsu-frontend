"use client";

import { useState } from "react";

import { useIsDemoMode } from "@/features/community/presentation/community-demo-context";
import { bffFetch } from "@/shared/lib/http/bff-fetch";
import {
  MenuBox,
  MenuItem,
} from "@/features/community/presentation/menu-box";
import {
  OutboundMessageType,
  closeNativeSubview,
  postToNative,
} from "@/shared/lib/native-bridge";
import { useToast } from "@/shared/ui";
import { AppBarShell } from "@/features/community/presentation/app-bar-shell";
import { ConfirmDialog } from "@/features/community/presentation/confirm-dialog";
import { useReportFlow } from "@/features/community/presentation/use-report-flow";
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
  postId,
  isOwner,
  initialNoticeEnabled,
}: {
  postId: number;
  isOwner: boolean;
  initialNoticeEnabled: boolean;
}) {
  const toast = useToast();
  const demo = useIsDemoMode();
  const { report, dialog: reportDialog } = useReportFlow();
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

  async function confirmDelete() {
    setDeleteConfirmOpen(false);

    // 예시(데모)에선 네트워크 없이 토스트만(실제 삭제/화면 닫기 없음).
    if (demo) {
      toast.show("게시물이 삭제되었습니다");
      return;
    }

    const response = await bffFetch(`/api/community/posts/${postId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      if (response.status === 401) {
        postToNative({ type: OutboundMessageType.AUTH_LOGIN_PROMPT });
      }
      toast.show("게시물 삭제에 실패했습니다");
      return;
    }

    toast.show("게시물이 삭제되었습니다");
    // 성공 → 네이티브가 상세 서브뷰를 닫고 목록으로 복귀(목록 갱신은 네이티브 책임).
    closeNativeSubview();
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
                <MenuItem
                  onClick={() => {
                    setMenuOpen(false);
                    void report({ reportType: "BOARD", targetId: postId });
                  }}
                >
                  신고하기
                </MenuItem>
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

      {/* 신고 알럿·사유 시트(웹 단독 폴백 전용 — 앱에서는 네이티브가 그린다) */}
      {reportDialog}
    </AppBarShell>
  );
}
