"use client";

import { useState } from "react";

import {
  MenuBox,
  MenuItem,
} from "@/features/community/presentation/menu-box";
import { MoreVerticalIcon } from "@/shared/ui/icons";

/**
 * 댓글 메뉴 항목(초안).
 * - 자신의 댓글(isOwner): 삭제
 * - 타인의 댓글: 차단 / 신고
 * FIXME: 삭제/차단/신고 실제 동작은 API·정책 확정 후 연결.
 */
const OWNER_MENU_ITEMS = ["삭제"] as const;
const OTHER_MENU_ITEMS = ["차단", "신고"] as const;

/**
 * 댓글 ⋮ 메뉴 (클라이언트 leaf).
 *
 * 공통 MenuBox를 버튼 top에 붙여 위로(top-right) 띄운다. 항목은 내 댓글 여부(isOwner)로 분기.
 */
export function CommentMenu({ isOwner }: { isOwner: boolean }) {
  const [open, setOpen] = useState(false);
  const items = isOwner ? OWNER_MENU_ITEMS : OTHER_MENU_ITEMS;

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
          {items.map((label) => (
            <MenuItem key={label} onClick={() => setOpen(false)}>
              {label}
            </MenuItem>
          ))}
        </MenuBox>
      ) : null}
    </div>
  );
}
