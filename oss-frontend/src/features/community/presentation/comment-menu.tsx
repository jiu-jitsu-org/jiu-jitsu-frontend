"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useIsDemoMode } from "@/features/community/presentation/community-demo-context";
import {
  COMMENT_REACTION_BUTTON,
  COMMENT_REACTION_ICON,
} from "@/features/community/presentation/comment-reaction-styles";
import { cn } from "@/shared/lib/cn";
import { bffFetch } from "@/shared/lib/http/bff-fetch";
import {
  MenuBox,
  MenuItem,
} from "@/features/community/presentation/menu-box";
import { OutboundMessageType, postToNative } from "@/shared/lib/native-bridge";
import { useReportFlow } from "@/features/community/presentation/use-report-flow";
import { useToast } from "@/shared/ui";
import { ConfirmDialog } from "@/features/community/presentation/confirm-dialog";
import { MoreVerticalIcon } from "@/shared/ui/icons";

/** 현재 열린 확인 알럿 종류. 신고는 useReportFlow가 알럿·시트를 함께 소유한다. */
type ActiveDialog = "delete" | "block" | null;

/**
 * 댓글 ⋮ 메뉴 (클라이언트 leaf).
 *
 * 항목은 내 댓글 여부(isOwner)로 분기:
 * - 자신의 댓글: 삭제
 * - 타인의 댓글: 차단 / 신고
 *
 * 삭제: 확인 알럿 → BFF DELETE /api/community/comments/{id} → 성공 시 router.refresh()로 목록 갱신.
 *   401이면 네이티브 로그인 유도. 데모(예시) 모드는 네트워크 없이 토스트만.
 * 신고: useReportFlow에 위임한다(확인 알럿 → 사유 시트 → POST /reports) — 게시글 ⋮와 같은 훅이라
 *   진입 지점에 따라 신고 경험이 갈리지 않는다. 성공 시 router.refresh() → 서버가 isReported로
 *   내려주면 본문이 "신고된 댓글입니다." placeholder로 바뀐다(#48). 댓글은 게시글과 달리 제거하지
 *   않는다 — 자리를 없애면 아래 대댓글이 부모를 잃어 스레드가 끊기기 때문.
 * 차단: 메뉴 → 확인 알럿 → 확정 시 처리 + 토스트.
 * 작성자 id/댓글 id는 웹이 들고 있다가 API에 직접 넘긴다(브릿지로 보내지 않음).
 * FIXME: 실제 차단 API 연동은 정책·계약 확정 후 추가(현재 토스트까지) — #54.
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
  const { report, dialog: reportDialog } = useReportFlow();
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

    const response = await bffFetch(`/api/community/comments/${commentId}`, {
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

  /**
   * 신고: useReportFlow(확인 알럿 → 사유 시트 → POST) → 처리되면 목록을 다시 읽어 placeholder로 전환.
   *
   * 중복 신고(409)도 훅이 처리 완료로 돌려준다 — 이미 신고한 댓글이라 화면 결과가 같아야 한다.
   */
  async function handleReport() {
    const reported = await report({
      reportType: "COMMENT",
      targetId: commentId,
    });
    // 예시(데모)는 네트워크 없이 안내만 하므로 서버 재조회도 하지 않는다.
    if (reported && !demo) router.refresh();
  }

  const items = isOwner
    ? [{ label: "삭제", onSelect: () => setDialog("delete") }]
    : [
        { label: "차단", onSelect: () => setDialog("block") },
        { label: "신고", onSelect: () => void handleReport() },
      ];

  return (
    <div className="relative">
      {/* ⋮ 버튼: eclipsis-vertical 16, 아이콘만, 좌우 여백 8(px-2), 높이 28(h-7).
          Active 상태 없음 — Default/Pressed만 (comment-reaction-styles). */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="댓글 메뉴"
        className={cn(COMMENT_REACTION_BUTTON, COMMENT_REACTION_ICON)}
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

      {/* 신고 알럿·사유 시트(웹 단독 폴백 전용 — 앱에서는 네이티브가 그린다) */}
      {reportDialog}
    </div>
  );
}
