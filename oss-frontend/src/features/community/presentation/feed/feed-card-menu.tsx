"use client";

import { useState } from "react";

import { useIsDemoMode } from "@/features/community/presentation/community-demo-context";
import { ConfirmDialog } from "@/features/community/presentation/confirm-dialog";
import {
  MenuBox,
  MenuItem,
} from "@/features/community/presentation/menu-box";
import { bffFetch } from "@/shared/lib/http/bff-fetch";
import { OutboundMessageType, postToNative } from "@/shared/lib/native-bridge";
import { useToast } from "@/shared/ui";
import { MoreVerticalIcon } from "@/shared/ui/icons";

/** 현재 열린 확인 알럿 종류. */
type ActiveDialog = "delete" | "report" | null;

/**
 * 피드 카드 ⋮ 메뉴 (클라이언트 leaf).
 *
 * 항목·문구·API는 상세 앱바(PostDetailAppBar)의 ⋮ 메뉴와 동일하게 맞춘다 — 같은 게시글을
 * 목록에서 열든 상세에서 열든 메뉴가 달라 보이면 안 되기 때문. 소유자면 삭제/수정,
 * 아니면 신고/숨기기.
 *
 * 상세와 다른 점은 성공 후 처리뿐이다: 상세는 서브뷰를 닫지만, 목록은 화면에 남아 있으므로
 * 삭제된 카드만 목록에서 걷어낸다(onDeleted). 카드가 사라지는 UX상 낙관적 제거가 아니라
 * 서버 성공을 확인한 뒤 제거한다.
 *
 * FIXME: 수정하기/숨기기는 상세와 동일하게 아직 미구현(메뉴만 닫힘) — 수정 화면 라우트와
 * 숨기기 API가 확정되면 두 화면을 함께 연결한다.
 */
export function FeedCardMenu({
  postId,
  isOwner,
  onDeleted,
}: {
  postId: number;
  isOwner: boolean;
  onDeleted: () => void;
}) {
  const toast = useToast();
  const demo = useIsDemoMode();
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<ActiveDialog>(null);

  async function confirmDelete() {
    setDialog(null);

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

  async function confirmReport() {
    setDialog(null);

    // 예시(데모)에선 네트워크 없이 토스트만(실제 신고 없음).
    if (demo) {
      toast.show("게시물을 신고했습니다");
      return;
    }

    // FIXME(reason): 사유 선택 UI가 없어 항상 "SPAM"으로 보낸다. 사유 picker 추가 시 교체.
    const response = await bffFetch("/api/community/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportType: "BOARD",
        targetId: postId,
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
          ? "이미 신고한 게시물이에요"
          : "게시물 신고에 실패했습니다",
      );
      return;
    }

    toast.show("게시물을 신고했습니다");
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
                  setDialog("delete");
                }}
              >
                삭제하기
              </MenuItem>
              <MenuItem onClick={() => setOpen(false)}>수정하기</MenuItem>
            </>
          ) : (
            <>
              <MenuItem
                onClick={() => {
                  setOpen(false);
                  setDialog("report");
                }}
              >
                신고하기
              </MenuItem>
              <MenuItem onClick={() => setOpen(false)}>숨기기</MenuItem>
            </>
          )}
        </MenuBox>
      ) : null}

      {/* 게시글 삭제 확인 알럿 */}
      <ConfirmDialog
        open={dialog === "delete"}
        title="게시글 삭제"
        message="삭제한 게시글은 복구할 수 없어요."
        confirmText="삭제"
        destructive
        onCancel={() => setDialog(null)}
        onConfirm={confirmDelete}
      />

      {/* 게시글 신고 확인 알럿 */}
      <ConfirmDialog
        open={dialog === "report"}
        title="게시글 신고"
        message="신고된 게시글은 검토 후 처리돼요."
        confirmText="신고"
        destructive
        onCancel={() => setDialog(null)}
        onConfirm={confirmReport}
      />
    </>
  );
}
