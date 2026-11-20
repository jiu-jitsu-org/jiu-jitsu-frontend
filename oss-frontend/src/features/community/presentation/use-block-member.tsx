"use client";

import { useCallback } from "react";

import { markBlockChanged } from "@/features/community/presentation/block-change-watcher";
import { useIsDemoMode } from "@/features/community/presentation/community-demo-context";
import { useNativeDialog } from "@/features/community/presentation/use-native-dialog";
import {
  trackUserBlock,
  type ContentMenuFrom,
} from "@/features/community/presentation/reaction-analytics";
import { bffFetch } from "@/shared/lib/http/bff-fetch";
import { requestNativeLogin } from "@/shared/lib/native-bridge";
import { useToast } from "@/shared/ui";

/** 차단할 회원 — 작성자 id와 확인창에 보일 닉네임. */
export type BlockTarget = { userId: number; nickname: string };

/**
 * 상세에서 신고하고 닫힌 뒤 목록 토스트에 [차단]을 잇는 액션 식별자(#550) — 상세가 남기고 목록이 해석한다(pending-toast).
 */
export const MEMBER_BLOCK_ACTION = "member-block";

/** 차단 BFF 응답의 data.blocked가 true인지 — 읽지 못하면 차단을 확인하지 못한 것으로 본다. */
async function isBlockedResult(response: Response): Promise<boolean> {
  try {
    const body = (await response.json()) as {
      data?: { blocked?: unknown };
    } | null;
    return body?.data?.blocked === true;
  } catch {
    return false;
  }
}

/** 차단 BFF 응답의 data.blocked가 분명히 false(풀림)인지 — 본문을 다시 읽을 수 있게 복사본을 읽는다. */
async function isUnblockedResult(response: Response): Promise<boolean> {
  try {
    const body = (await response.clone().json()) as {
      data?: { blocked?: unknown };
    } | null;
    return body?.data?.blocked === false;
  } catch {
    return false;
  }
}

/**
 * 회원 차단 흐름 — 확인 알럿 → POST /api/community/users/{id}/block → 결과가 차단일 때만 완료 안내.
 *
 * 댓글 ⋮ 차단과 신고 완료 토스트의 [차단](#550)이 같은 흐름을 쓴다(문구 · 확인이 진입점마다 갈리면 안 된다).
 * 차단되면 다른 웹뷰(홈 피드 등)가 다시 보일 때 반영하도록 알리고(markBlockChanged, #531), 이 화면의 다시 읽기는
 * 호출부가 한다(댓글은 router.refresh, 피드는 불러온 페이지 다시 읽기).
 *
 * from: 차단을 누른 메뉴(GA `user_block`, #580). 신고 뒤 [차단]은 신고한 메뉴다.
 *
 * @returns block(차단 완료 여부를 돌려준다) + 웹 폴백 확인창(`dialog`, 트리에 렌더 필요)
 */
export function useBlockMember() {
  const toast = useToast();
  const demo = useIsDemoMode();
  const { confirm, dialog } = useNativeDialog();

  const block = useCallback(
    async (
      { userId, nickname }: BlockTarget,
      from: ContentMenuFrom,
    ): Promise<boolean> => {
      const confirmed = await confirm({
        // title은 titleParts를 모르는 구버전 앱용 완성 문자열 — 둘의 내용이 어긋나면 안 된다.
        title: `${nickname}님 차단`,
        // 1줄 고정 정책: 긴 닉네임만 말줄임하고 "님 차단"은 항상 온전히 보이게 경계를 넘긴다.
        titleParts: { truncatable: nickname, suffix: "님 차단" },
        message: "차단하면 해당 유저의 글과 댓글이 보이지 않아요.",
        confirmText: "차단",
        destructive: true,
      });
      if (!confirmed) return false;

      // 예시(데모)에선 네트워크 없이 토스트만(실제 차단/목록 갱신 없음).
      if (demo) {
        toast.show("유저를 차단했어요", { tone: "success" });
        return false;
      }

      const request = () =>
        bffFetch(`/api/community/users/${userId}/block`, {
          method: "POST",
        }).catch(() => null);
      let response = await request();
      // 업스트림이 토글이라 이미 차단한 회원이면 이 호출이 차단을 푼다(#488). 저장 목록처럼 차단한 회원 글이 남는
      // 곳에서 신고 뒤 [차단]을 누르면 생긴다(#550) — 결과가 풀림이면 한 번 더 불러 차단으로 되돌린다.
      if (response?.ok && (await isUnblockedResult(response))) {
        response = await request();
      }

      if (!response?.ok) {
        if (response?.status === 401) {
          requestNativeLogin("block");
        }
        toast.show("유저를 차단하지 못했어요", {
          tone: "error",
          error: { status: response?.status },
        });
        return false;
      }

      // 결과가 차단일 때만 차단 완료로 안내한다.
      if (!(await isBlockedResult(response))) {
        toast.show("유저를 차단하지 못했어요", { tone: "error" });
        return false;
      }

      trackUserBlock(true, from);
      toast.show("유저를 차단했어요", { tone: "success" });
      // 뒤에 떠 있는 홈 피드 등이 다시 보일 때 그 회원 글을 빼게 알린다(#531).
      markBlockChanged();
      return true;
    },
    [confirm, demo, toast],
  );

  return { block, dialog };
}
