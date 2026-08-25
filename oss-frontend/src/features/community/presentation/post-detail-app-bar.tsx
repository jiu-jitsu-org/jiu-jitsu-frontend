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
  isNativeBridgeAvailable,
  postToNative,
} from "@/shared/lib/native-bridge";
import { enqueuePendingToast, useToast } from "@/shared/ui";
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

  /**
   * 상세를 닫고 이전 화면(목록)으로 돌아간다.
   *
   * 앱은 상세가 별도 서브뷰 웹뷰라 네이티브가 팝해야 하고, 웹 단독 진입은 브라우저 히스토리를
   * 되돌린다 — 두 경우 모두 "직전 화면으로 복귀"라는 같은 결과가 된다.
   */
  function closeDetail() {
    if (isNativeBridgeAvailable()) {
      closeNativeSubview();
      return;
    }
    window.history.back();
  }

  /**
   * 신고: 확인 알럿 → 사유 시트 → POST(useReportFlow) → 처리되면 상세를 닫는다.
   *
   * 신고자 본인 화면에서는 그 콘텐츠가 즉시 사라져야 하는데(#48), 상세는 글 하나가 화면 전부라
   * 숨길 대상이 없다 → 삭제와 같이 화면을 닫는 것이 곧 비노출이다.
   *
   * 목록에서 카드가 사라지는 것은 여기서 신호를 보내지 않는다 — 상세 복귀 시 해당 게시글을
   * 단건 재조회해 비노출이면 걷어내는 경로(#73)가 담당한다. 서버 응답에서 신고한 글이 빠지는 것
   * 자체는 백엔드 몫이다(목록 페이징이 깨지므로 클라이언트에서 필터링하지 않는다).
   */
  async function handleReport() {
    await report(
      { reportType: "BOARD", targetId: postId },
      {
        onReported: (message) => {
          // 예시(데모)에선 화면을 닫지 않으므로 이 화면에서 바로 띄운다.
          if (demo) {
            toast.show(message);
            return;
          }

          // 닫히는 화면에 띄우면 토스트도 함께 사라진다 → 문구만 넘기고 목록이 띄운다.
          enqueuePendingToast(message);
          closeDetail();
        },
      },
    );
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
                    void handleReport();
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
