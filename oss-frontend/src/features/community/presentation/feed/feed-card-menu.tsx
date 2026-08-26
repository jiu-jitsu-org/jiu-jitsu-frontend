"use client";

import { useState } from "react";

import { useIsDemoMode } from "@/features/community/presentation/community-demo-context";
import {
  HIDE_TOAST,
  toggleHidePost,
} from "@/features/community/presentation/hide-post";
import {
  MenuBox,
  MenuItem,
} from "@/features/community/presentation/menu-box";
import { useNativeDialog } from "@/features/community/presentation/use-native-dialog";
import { useOpenPostEdit } from "@/features/community/presentation/use-open-post-edit";
import { useReportFlow } from "@/features/community/presentation/use-report-flow";
import { bffFetch } from "@/shared/lib/http/bff-fetch";
import { OutboundMessageType, postToNative } from "@/shared/lib/native-bridge";
import { useToast } from "@/shared/ui";
import { MoreVerticalIcon } from "@/shared/ui/icons";

/**
 * 피드 카드 ⋮ 메뉴 (클라이언트 leaf).
 *
 * 항목·문구는 상세 앱바(PostDetailAppBar)의 ⋮ 메뉴와 맞춘다 — 같은 게시글을 목록에서 열든
 * 상세에서 열든 메뉴가 달라 보이면 안 되기 때문. 소유자면 삭제/수정, 아니면 신고/숨기기.
 *
 * 확인 알럿·신고 사유 시트는 useNativeDialog가 "네이티브 우선, 없으면 웹"으로 띄운다.
 * 앱에서는 GNB·하단 탭바까지 덮는 딤이 필요해 표면을 네이티브가 소유해야 하고(웹뷰는 자기 프레임
 * 밖을 못 그림), 무엇을 물어보고 확인 후 무엇을 호출할지는 여기(웹)가 그대로 쥔다.
 * 계약 상세: docs/native-dialog-bridge.md
 *
 * 삭제/신고 모두 성공하면 목록에서 카드를 걷어낸다(onDeleted). 카드가 사라지는 UX라 낙관적 제거가
 * 아니라 서버 성공을 확인한 뒤 제거한다.
 */
export function FeedCardMenu({
  postId,
  isOwner,
  onDeleted,
  onRestored,
}: {
  postId: number;
  isOwner: boolean;
  onDeleted: () => void;
  /** 숨기기 되돌리기 — 걷어낸 카드를 원래 자리에 복원한다. */
  onRestored: () => void;
}) {
  const toast = useToast();
  const demo = useIsDemoMode();
  const openPostEdit = useOpenPostEdit();
  const { confirm, dialog } = useNativeDialog();
  const { report, dialog: reportDialog } = useReportFlow();
  const [open, setOpen] = useState(false);

  /** 삭제: 확인 알럿 → DELETE → 성공 시 목록에서 제거. */
  async function handleDelete() {
    const confirmed = await confirm({
      title: "게시글 삭제",
      message: "삭제한 게시글은 복구할 수 없어요.",
      confirmText: "삭제",
      destructive: true,
    });
    if (!confirmed) return;

    // 예시(데모)에선 네트워크 없이 토스트만(실제 삭제 없음).
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
    onDeleted();
  }

  /** 신고: 확인 알럿 → 사유 시트 → POST(useReportFlow) → 성공 시 목록에서 제거(숨김). */
  async function handleReport() {
    const reported = await report({ reportType: "BOARD", targetId: postId });
    if (reported) onDeleted();
  }

  /**
   * 숨기기: 확인 알럿 없이 바로 처리하고, 되돌리기 버튼이 달린 토스트로 취소 기회를 준다.
   *
   * 되돌리기는 같은 엔드포인트를 한 번 더 호출한다(토글이라 두 번째 호출이 숨김 해제가 된다).
   * 실패하면 카드는 숨겨진 상태로 두고 실패만 알린다 — 서버와 화면이 어긋나는 편보다 낫다.
   *
   * 상세에서 숨긴 경우는 이 화면이 아니라 목록이 되돌리기를 받는다(#51) — 호출·문구는
   * hide-post에 모여 있어 두 진입점이 갈리지 않는다.
   */
  async function handleHide() {
    // 예시(데모)에선 네트워크 없이 UI만(되돌리기도 로컬 복원).
    if (demo) {
      onDeleted();
      toast.show(HIDE_TOAST.done, {
        label: HIDE_TOAST.undoLabel,
        onAction: onRestored,
      });
      return;
    }

    const hidden = await toggleHidePost(postId);
    if (!hidden) {
      toast.show(HIDE_TOAST.failed);
      return;
    }

    onDeleted();
    toast.show(HIDE_TOAST.done, {
      label: HIDE_TOAST.undoLabel,
      onAction: () => void handleUndoHide(),
    });
  }

  /** 숨기기 되돌리기 — 토글 재호출로 숨김을 해제하고 카드를 원래 자리에 복원한다. */
  async function handleUndoHide() {
    const restored = await toggleHidePost(postId);
    if (!restored) {
      toast.show(HIDE_TOAST.undoFailed);
      return;
    }

    onRestored();
  }

  return (
    <>
      {/* 트리거: 헤더 스펙 그대로(28x32, eclipsis-vertical 16) */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="게시물 메뉴 열기"
        className="inline-flex h-7 w-8 items-center justify-center text-feed-card-header-more-icon"
      >
        <MoreVerticalIcon size={16} />
      </button>

      {open ? (
        <MenuBox placement="bottom-right" onClose={() => setOpen(false)}>
          {/* 자신 게시글: 삭제/수정 · 타인 게시글: 신고/숨기기 */}
          {isOwner ? (
            <>
              <MenuItem
                onClick={() => {
                  setOpen(false);
                  void handleDelete();
                }}
              >
                삭제하기
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setOpen(false);
                  openPostEdit(postId);
                }}
              >
                수정하기
              </MenuItem>
            </>
          ) : (
            <>
              <MenuItem
                onClick={() => {
                  setOpen(false);
                  void handleReport();
                }}
              >
                신고하기
              </MenuItem>
              {/* 숨기기는 확인 알럿 없이 바로 처리 — 되돌리기 토스트가 취소 수단이다. */}
              <MenuItem
                onClick={() => {
                  setOpen(false);
                  void handleHide();
                }}
              >
                숨기기
              </MenuItem>
            </>
          )}
        </MenuBox>
      ) : null}

      {/* 네이티브가 그리는 경우 아무것도 렌더하지 않는다(웹 단독 폴백 전용). */}
      {dialog}
      {reportDialog}
    </>
  );
}
