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
import {
  OutboundMessageType,
  postToNative,
  useIsExternalBrowser,
} from "@/shared/lib/native-bridge";
import { useReportFlow } from "@/features/community/presentation/use-report-flow";
import { useToast } from "@/shared/ui";
import { useNativeDialog } from "@/features/community/presentation/use-native-dialog";
import { MoreVerticalIcon } from "@/shared/ui/icons";

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
 * 차단: 확인 알럿 → BFF POST /api/community/users/{authorId}/block → 성공 시 router.refresh().
 *   대상이 댓글 1건이 아니라 작성자 회원이라 commentId가 아닌 authorId를 넘긴다 — 그 회원의
 *   게시글은 목록에서 빠지고 댓글은 placeholder로 바뀐다(#53).
 * 작성자 id/댓글 id는 웹이 들고 있다가 API에 직접 넘긴다(브릿지로 보내지 않음).
 *
 * 삭제·차단 확인 알럿은 useNativeDialog가 "네이티브 우선, 없으면 웹"으로 띄운다 — 피드 카드 ⋮와
 * 같은 경로다. 무엇을 물어보고 확인 후 무엇을 호출할지는 여기(웹)가 그대로 쥔다.
 * 계약 상세: docs/native-dialog-bridge.md
 */
export function CommentMenu({
  commentId,
  authorId,
  isOwner,
  authorNickname,
}: {
  commentId: number;
  /** 댓글 작성자 회원 id — 차단 대상. 차단은 댓글 1건이 아니라 이 회원 전체가 대상이다. */
  authorId: number;
  isOwner: boolean;
  authorNickname: string;
}) {
  const router = useRouter();
  const demo = useIsDemoMode();
  const { confirm, dialog } = useNativeDialog();
  const { report, dialog: reportDialog } = useReportFlow();
  const [open, setOpen] = useState(false);
  const toast = useToast();
  // 외부 브라우저(비로그인)에서는 메뉴 자체를 감춘다(#72).
  // 삭제 · 신고 · 차단 모두 계정이 있어야 성립하는 동작이라, 비로그인에게는 열어줄 항목이 없다.
  const externalBrowser = useIsExternalBrowser();

  /** 삭제: 확인 알럿 → DELETE → 성공 시 목록 갱신. */
  async function handleDelete() {
    const confirmed = await confirm({
      title: "댓글 삭제",
      message: "삭제한 댓글은 복구할 수 없어요.",
      confirmText: "삭제",
      destructive: true,
    });
    if (!confirmed) return;

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

  /** 차단: 확인 알럿 → POST → 성공 시 목록 갱신. */
  async function handleBlock() {
    const confirmed = await confirm({
      title: `${authorNickname}님 차단`,
      message: "차단하면 해당 유저의 글과 댓글이 보이지 않아요.",
      confirmText: "차단",
      destructive: true,
    });
    if (!confirmed) return;

    // 예시(데모)에선 네트워크 없이 토스트만(실제 차단/목록 갱신 없음).
    if (demo) {
      toast.show("유저를 차단했습니다.");
      return;
    }

    const response = await bffFetch(`/api/community/users/${authorId}/block`, {
      method: "POST",
    });

    if (!response.ok) {
      if (response.status === 401) {
        postToNative({ type: OutboundMessageType.AUTH_LOGIN_PROMPT });
      }
      toast.show("유저 차단에 실패했습니다.");
      return;
    }

    toast.show("유저를 차단했습니다.");
    // 서버 렌더 목록 재요청 — 차단된 회원의 댓글은 placeholder로, 게시글은 목록에서 빠진다.
    router.refresh();
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
    ? [{ label: "삭제", onSelect: () => void handleDelete() }]
    : [
        { label: "차단", onSelect: () => void handleBlock() },
        { label: "신고", onSelect: () => void handleReport() },
      ];

  if (externalBrowser) {
    return null;
  }

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

      {/* 삭제·차단 확인 알럿(웹 단독 폴백 전용 — 앱에서는 네이티브가 그린다) */}
      {dialog}

      {/* 신고 알럿·사유 시트(웹 단독 폴백 전용 — 앱에서는 네이티브가 그린다) */}
      {reportDialog}
    </div>
  );
}
