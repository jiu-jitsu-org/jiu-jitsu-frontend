"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useIsDemoMode } from "@/features/community/presentation/community-demo-context";
import {
  MenuBox,
  MenuItem,
} from "@/features/community/presentation/menu-box";
import { OutboundMessageType, postToNative } from "@/shared/lib/native-bridge";
import { ConfirmDialog, useToast } from "@/shared/ui";
import { MoreVerticalIcon } from "@/shared/ui/icons";

/** 현재 열린 확인 알럿 종류. */
type ActiveDialog = "delete" | "block" | "report" | null;

/**
 * 댓글 ⋮ 메뉴 (클라이언트 leaf).
 *
 * 항목은 내 댓글 여부(isOwner)로 분기:
 * - 자신의 댓글: 삭제
 * - 타인의 댓글: 차단 / 신고
 *
 * 삭제: 확인 알럿 → BFF DELETE /api/community/comments/{id} → 성공 시 router.refresh()로 목록 갱신.
 *   401이면 네이티브 로그인 유도. 데모(예시) 모드는 네트워크 없이 토스트만.
 * 차단·신고 플로우(A안, 전부 웹): 메뉴 → 커스텀 확인 알럿 → 확정 시 처리 + 토스트.
 * 작성자 id/댓글 id는 웹이 들고 있다가 API에 직접 넘긴다(브릿지로 보내지 않음).
 * FIXME: 실제 차단/신고 API 연동은 정책·계약 확정 후 추가(현재 토스트까지).
 */
export function CommentMenu({
  commentId,
  isOwner,
  authorNickname,
}: {
  commentId: number;
  isOwner: boolean;
  authorNickname: string;
}) {
  const router = useRouter();
  const demo = useIsDemoMode();
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<ActiveDialog>(null);
  const toast = useToast();

  async function confirmDelete() {
    setDialog(null);

    // 예시(데모)에선 네트워크 없이 토스트만(목록 갱신/삭제 없음).
    if (demo) {
      toast.show("댓글을 삭제했습니다.");
      return;
    }

    const response = await fetch(`/api/community/comments/${commentId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      if (response.status === 401) {
        postToNative({ type: OutboundMessageType.AUTH_LOGIN_PROMPT });
      }
      toast.show("댓글 삭제에 실패했습니다.");
      return;
    }

    toast.show("댓글을 삭제했습니다.");
    // 서버 렌더 목록 재요청 — 삭제된 댓글이 빠진다.
    router.refresh();
  }

  function confirmBlock() {
    setDialog(null);
    // FIXME(API): 차단 처리(작성자 userId) + 성공 시 해당 유저 댓글 목록에서 제거.
    toast.show("유저를 차단했습니다.");
  }

  async function confirmReport() {
    setDialog(null);

    // 예시(데모)에선 네트워크 없이 토스트만(실제 신고 없음).
    if (demo) {
      toast.show("댓글을 신고했습니다.");
      return;
    }

    // FIXME(reason): 사유 선택 UI가 없어 항상 "SPAM"으로 보낸다. 사유 picker 추가 시 교체.
    const response = await fetch("/api/community/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportType: "COMMENT",
        targetId: commentId,
        reason: "SPAM",
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        postToNative({ type: OutboundMessageType.AUTH_LOGIN_PROMPT });
      }
      // 동일 대상 중복 신고는 서버가 막는다(409 가정).
      toast.show(
        response.status === 409
          ? "이미 신고한 댓글이에요."
          : "댓글 신고에 실패했습니다.",
      );
      return;
    }

    toast.show("댓글을 신고했습니다.");
  }

  const items = isOwner
    ? [{ label: "삭제", onSelect: () => setDialog("delete") }]
    : [
        { label: "차단", onSelect: () => setDialog("block") },
        { label: "신고", onSelect: () => setDialog("report") },
      ];

  return (
    <div className="relative">
      {/* ⋮ 버튼: eclipsis-vertical 16, 아이콘만, 좌우 여백 8(px-2), 높이 28(h-7) */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="댓글 메뉴"
        className="inline-flex h-7 items-center justify-center px-2 text-reaction-bar-default-icon"
      >
        <MoreVerticalIcon size={16} />
      </button>

      {open ? (
        <MenuBox placement="top-right" onClose={() => setOpen(false)}>
          {items.map((item) => (
            <MenuItem
              key={item.label}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
            >
              {item.label}
            </MenuItem>
          ))}
        </MenuBox>
      ) : null}

      {/* 삭제 확인 알럿 */}
      <ConfirmDialog
        open={dialog === "delete"}
        title="댓글 삭제"
        message="삭제한 댓글은 복구할 수 없어요."
        confirmText="삭제"
        destructive
        onCancel={() => setDialog(null)}
        onConfirm={confirmDelete}
      />

      {/* 차단 확인 알럿 */}
      <ConfirmDialog
        open={dialog === "block"}
        title={`${authorNickname}님 차단`}
        message="차단하면 해당 유저의 글과 댓글이 보이지 않아요."
        confirmText="차단"
        destructive
        onCancel={() => setDialog(null)}
        onConfirm={confirmBlock}
      />

      {/* 신고 확인 알럿 */}
      <ConfirmDialog
        open={dialog === "report"}
        title="댓글 신고"
        message="신고된 댓글은 검토 후 처리돼요."
        confirmText="신고"
        destructive
        onCancel={() => setDialog(null)}
        onConfirm={confirmReport}
      />
    </div>
  );
}
