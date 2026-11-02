"use client";

import { useRef, useState } from "react";

import type { BlockedMember } from "@/features/community/domain/blocked-member";
import { BlockedMemberItem } from "@/features/community/presentation/blocked-members/blocked-member-item";
import { BlockedMembersAppBar } from "@/features/community/presentation/blocked-members/blocked-members-app-bar";
import { BlockedMembersEmptyState } from "@/features/community/presentation/blocked-members/blocked-members-empty-state";
import { useNativeDialog } from "@/features/community/presentation/use-native-dialog";
import { bffFetch } from "@/shared/lib/http/bff-fetch";
import { OutboundMessageType, postToNative } from "@/shared/lib/native-bridge";
import { useToast } from "@/shared/ui";

/**
 * 차단한 회원 화면 본체 (클라이언트) — 목록 · 차단 해제.
 *
 * 해제: 확인 알럿 → 줄을 먼저 지우고(낙관적) DELETE /api/community/users/{id}/block(해제 전용).
 *   이미 풀려 있던 회원이어도 서버가 성공으로 답한다. 실패(네트워크 · 401 · 5xx)일 때만 줄을 원래 자리로
 *   되돌리고 토스트로 알린다.
 *   같은 회원의 확인 알럿 · 요청이 끝나기 전에는 다시 받지 않는다(연타 방지 — 버튼은 줄과 함께 사라진다).
 * 지운 줄은 id 집합으로만 기억해 되돌릴 때 순서가 그대로 유지된다.
 */
export function BlockedMembersView({
  initialMembers,
}: {
  initialMembers: BlockedMember[];
}) {
  const [removedIds, setRemovedIds] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  const pendingIds = useRef(new Set<number>());
  const { confirm, dialog } = useNativeDialog();
  const toast = useToast();

  const members = initialMembers.filter(
    (member) => !removedIds.has(member.userId),
  );

  function setRemoved(userId: number, removed: boolean) {
    setRemovedIds((ids) => {
      const next = new Set(ids);
      if (removed) next.add(userId);
      else next.delete(userId);
      return next;
    });
  }

  async function handleUnblock(member: BlockedMember) {
    const { userId, nickname } = member;
    if (pendingIds.current.has(userId)) return;
    pendingIds.current.add(userId);

    try {
      const confirmed = await confirm({
        // title은 titleParts를 모르는 구버전 앱용 완성 문자열 — 둘의 내용이 어긋나면 안 된다.
        title: `${nickname}님 차단 해제`,
        // 1줄 고정 정책: 긴 닉네임만 말줄임하고 "님 차단 해제"는 항상 온전히 보이게 경계를 넘긴다.
        titleParts: { truncatable: nickname, suffix: "님 차단 해제" },
        message: "이 회원의 글과 댓글이 다시 보여요.",
        confirmText: "차단 해제",
        cancelText: "취소",
      });
      if (!confirmed) return;

      setRemoved(userId, true);

      const response = await bffFetch(`/api/community/users/${userId}/block`, {
        method: "DELETE",
      }).catch(() => null);

      if (!response?.ok) {
        setRemoved(userId, false);
        if (response?.status === 401) {
          postToNative({ type: OutboundMessageType.AUTH_LOGIN_PROMPT });
        }
        toast.show("차단을 해제하지 못했어요");
        return;
      }

      toast.show("차단을 해제했어요");
    } finally {
      pendingIds.current.delete(userId);
    }
  }

  return (
    <>
      <BlockedMembersAppBar />

      {members.length === 0 ? (
        <BlockedMembersEmptyState />
      ) : (
        <ul className="pt-2 pb-[calc(16px+env(safe-area-inset-bottom))]">
          {members.map((member) => (
            <BlockedMemberItem
              key={member.userId}
              member={member}
              onUnblock={(target) => void handleUnblock(target)}
            />
          ))}
        </ul>
      )}

      {dialog}
    </>
  );
}
