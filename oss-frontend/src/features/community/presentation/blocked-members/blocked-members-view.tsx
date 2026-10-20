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
 * 해제: 확인 알럿 → 줄을 먼저 지우고(낙관적) POST /api/community/users/{id}/block(차단과 같은 토글).
 *   실패하거나 응답이 blocked:true(토글이 오히려 다시 차단함)면 줄을 원래 자리로 되돌리고 토스트로 알린다.
 *   같은 회원의 확인 알럿 · 요청이 끝나기 전에는 다시 받지 않는다(연타 방지 — 버튼은 줄과 함께 사라진다).
 * 지운 줄은 id 집합으로만 기억해 되돌릴 때 순서가 그대로 유지된다.
 *
 * sample(dev 전용 예시 데이터)이면 서버에 보내지 않고 화면에서만 지운다.
 */
export function BlockedMembersView({
  initialMembers,
  sample,
}: {
  initialMembers: BlockedMember[];
  sample: boolean;
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

      // (dev 전용) 예시 데이터는 서버에 보내지 않는다.
      if (sample) {
        toast.show("차단을 해제했어요");
        return;
      }

      const response = await bffFetch(`/api/community/users/${userId}/block`, {
        method: "POST",
      }).catch(() => null);
      const blocked = response?.ok ? await readBlocked(response) : null;

      // blocked가 false여야 해제 성공 — true면 이미 풀려 있던 회원을 토글이 다시 차단한 것이다.
      // 다시 차단된 경우에도 서버 상태를 추측해 한 번 더 토글하지 않는다 — 줄을 되돌리고 알린다.
      if (blocked !== false) {
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

/** BFF 응답 { success, data: { blocked } }에서 토글 후 차단 여부를 읽는다. 형태가 다르면 null(실패로 본다). */
async function readBlocked(response: Response): Promise<boolean | null> {
  const body = (await response.json().catch(() => null)) as {
    data?: { blocked?: unknown };
  } | null;
  const blocked = body?.data?.blocked;
  return typeof blocked === "boolean" ? blocked : null;
}
