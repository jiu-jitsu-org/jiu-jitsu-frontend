"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import type { BlockedMember } from "@/features/community/domain/blocked-member";
import { useOnBlockChange } from "@/features/community/presentation/block-change-watcher";
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
 * 지운 줄은 id로만 기억해 되돌릴 때 순서가 그대로 유지된다.
 *
 * 앱에서 차단이 바뀌면(#488 USER_BLOCK_CHANGED, 남의 프로필 ⋯ — jiu-jitsu-ios#328) 목록을 다시 받는다(#494).
 * 이 화면은 서브뷰로 떠 있는 채 다른 탭에서 차단이 바뀔 수 있다. 다시 받은 목록이 서버 기준이므로 해제가 끝난
 * 줄의 기억은 버린다 — 남겨 두면 그 회원을 다시 차단해도 계속 빠져 보인다. 해제 요청 중인 줄만 계속 감춘다.
 */
export function BlockedMembersView({
  initialMembers,
}: {
  initialMembers: BlockedMember[];
}) {
  const router = useRouter();
  // 지운 줄 — requesting: 해제 요청 중, done: 해제됨(목록을 다시 받기 전까지 감춤).
  const [removedIds, setRemovedIds] = useState<
    ReadonlyMap<number, "requesting" | "done">
  >(() => new Map());
  // 서버가 목록을 새로 주면(다시 받기) 해제가 끝난 줄의 기억을 버린다 — 렌더 중에 바로 맞춰 옛 기억으로
  // 걸러진 목록이 한 번도 그려지지 않게 한다.
  const [shownInitial, setShownInitial] = useState(initialMembers);
  if (shownInitial !== initialMembers) {
    setShownInitial(initialMembers);
    setRemovedIds(
      (ids) =>
        new Map([...ids].filter(([, state]) => state === "requesting")),
    );
  }
  useOnBlockChange(() => router.refresh());
  const pendingIds = useRef(new Set<number>());
  const { confirm, dialog } = useNativeDialog();
  const toast = useToast();

  const members = initialMembers.filter(
    (member) => !removedIds.has(member.userId),
  );

  function setRemoved(
    userId: number,
    state: "requesting" | "done" | null,
  ) {
    setRemovedIds((ids) => {
      const next = new Map(ids);
      if (state) next.set(userId, state);
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

      setRemoved(userId, "requesting");

      const response = await bffFetch(`/api/community/users/${userId}/block`, {
        method: "DELETE",
      }).catch(() => null);

      if (!response?.ok) {
        setRemoved(userId, null);
        if (response?.status === 401) {
          postToNative({ type: OutboundMessageType.AUTH_LOGIN_PROMPT });
        }
        toast.show("차단을 해제하지 못했어요", { tone: "error" });
        return;
      }

      setRemoved(userId, "done");
      toast.show("차단을 해제했어요", { tone: "success" });
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
        <ul className="pt-2 pb-[calc(16px+var(--safe-area-bottom))]">
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
