"use client";

import { useState } from "react";

import {
  MenuBox,
  MenuItem,
} from "@/features/community/presentation/menu-box";
import { ConfirmDialog, useToast } from "@/shared/ui";
import { MoreVerticalIcon } from "@/shared/ui/icons";

/**
 * 댓글 ⋮ 메뉴 (클라이언트 leaf).
 *
 * 항목은 내 댓글 여부(isOwner)로 분기:
 * - 자신의 댓글: 삭제
 * - 타인의 댓글: 차단 / 신고
 *
 * 차단 플로우(A안, 전부 웹): 차단 → 커스텀 확인 알럿 → 확정 시 차단 처리 + 토스트.
 * 작성자 id/댓글 id는 웹이 들고 있다가 API에 직접 넘긴다(브릿지로 보내지 않음).
 * FIXME: 삭제/신고 동작과 실제 차단 API 연동은 정책·계약 확정 후 추가(현재 토스트까지).
 */
export function CommentMenu({
  isOwner,
  authorNickname,
}: {
  isOwner: boolean;
  authorNickname: string;
}) {
  const [open, setOpen] = useState(false);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const toast = useToast();

  function confirmBlock() {
    setBlockConfirmOpen(false);
    // FIXME: POST 차단 API(작성자 userId) 연동 + 성공 시 해당 유저 댓글 목록에서 제거.
    toast.show("유저를 차단했습니다.");
  }

  const items = isOwner
    ? [{ label: "삭제", onSelect: () => {} }]
    : [
        { label: "차단", onSelect: () => setBlockConfirmOpen(true) },
        { label: "신고", onSelect: () => {} },
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

      {/* 차단 확인 알럿 */}
      <ConfirmDialog
        open={blockConfirmOpen}
        title={`${authorNickname}님 차단`}
        message="차단하면 해당 유저의 글과 댓글이 보이지 않아요."
        confirmText="차단"
        destructive
        onCancel={() => setBlockConfirmOpen(false)}
        onConfirm={confirmBlock}
      />
    </div>
  );
}
