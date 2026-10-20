"use client";

import type { BlockedMember } from "@/features/community/domain/blocked-member";
import { Avatar } from "@/features/community/presentation/avatar";
import { cn } from "@/shared/lib/cn";
import { NEUTRAL_BUTTON_PRESS } from "@/shared/ui/press-styles";

/**
 * 차단한 회원 한 줄 — 아바타(40) + 닉네임 + "차단 해제" 버튼.
 *
 * 줄 사이 구분선은 두지 않고 세로 여백(위아래 10)으로만 나눈다. 긴 닉네임은 한 줄 말줄임.
 * 버튼은 빈 화면 버튼(EmptyState)과 같은 neutral 색 · 눌림을 줄 크기(32)로 줄인 것이다.
 */
export function BlockedMemberItem({
  member,
  onUnblock,
}: {
  member: BlockedMember;
  onUnblock: (member: BlockedMember) => void;
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      <Avatar
        src={member.profileImageUrl}
        className="size-10"
        iconSize={24}
      />
      <span className="min-w-0 flex-1 truncate text-body-m text-text-primary">
        {member.nickname}
      </span>
      <button
        type="button"
        onClick={() => onUnblock(member)}
        className={cn(
          "inline-flex h-8 shrink-0 items-center justify-center rounded-[8px] bg-button-neutral-default-bg px-3 text-button-s text-button-neutral-default-text",
          NEUTRAL_BUTTON_PRESS,
        )}
      >
        차단 해제
      </button>
    </li>
  );
}
