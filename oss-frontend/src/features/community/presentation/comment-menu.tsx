"use client";

import { useState } from "react";

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
 * 정렬 드롭다운(CommentSortSelect)과 유사한 박스 스타일을 재사용하되,
 * 메뉴는 하단이 아니라 **버튼 top에 붙여 위로** 띄운다(bottom-full).
 * 항목은 내 댓글 여부(isOwner)에 따라 분기한다.
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
        <>
          {/* 바깥 클릭으로 닫기 위한 투명 백드롭 */}
          <button
            type="button"
            aria-label="메뉴 닫기"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          {/* 메뉴 박스: 버튼 top에 붙여 위로(bottom-full) 우측 정렬.
              fill list/setting/background, stroke CoolGray/50(inside 1px), radius 16, 너비 140,
              상/하단 여백 4(py-1), 항목 간격 4(gap-1). */}
          <ul
            role="menu"
            className="absolute bottom-full right-0 z-20 flex w-[140px] flex-col gap-1 overflow-hidden rounded-2xl border border-[var(--cool-gray-50)] bg-list-setting-background py-1"
          >
            {items.map((label) => (
              <li key={label} role="menuitem">
                {/* 항목: 높이 41, Body S(14/21), 색 list/setting/text */}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-[41px] w-full items-center px-4 text-sm leading-[21px] text-list-setting-text"
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
