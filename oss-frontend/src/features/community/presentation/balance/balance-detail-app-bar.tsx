"use client";

import { useState } from "react";

import { AppBarShell } from "@/features/community/presentation/app-bar-shell";
import { useIsDemoMode } from "@/features/community/presentation/community-demo-context";
import { bffFetch } from "@/shared/lib/http/bff-fetch";
import { OutboundMessageType, postToNative } from "@/shared/lib/native-bridge";
import { useToast } from "@/shared/ui";
import { BellIcon, BellOffIcon } from "@/shared/ui/icons";

/**
 * 밸런스 게임 상세 앱바 (클라이언트 leaf).
 *
 * 게시글 상세(PostDetailAppBar)와 **⋮ 메뉴가 없다** — 서비스가 제공하는 콘텐츠라 수정·삭제·
 * 신고·숨기기 대상이 아니다. 남는 것은 알림 종 하나뿐이라 메뉴·확인 알럿·신고 플로우를 통째로
 * 들고 오지 않고 따로 둔다.
 *
 * 뒤로가기를 두지 않는 것도 게시글 상세와 같다 — 앱에서는 네이티브 내비게이션이, 웹 단독에서는
 * 브라우저 히스토리가 담당한다.
 */
function alarmToast(enabled: boolean): string {
  return enabled ? "알림을 받아요" : "알림을 받지 않아요";
}

export function BalanceDetailAppBar({
  contentId,
  initialNoticeEnabled,
}: {
  contentId: number;
  initialNoticeEnabled: boolean;
}) {
  const toast = useToast();
  const demo = useIsDemoMode();
  const [alarmOn, setAlarmOn] = useState(initialNoticeEnabled);
  // 저장 중 재탭 방지 — 토글 엔드포인트라 연타하면 서버 상태가 화면과 어긋난 채로 뒤집힌다.
  const [alarmPending, setAlarmPending] = useState(false);

  /**
   * 알림 받기 토글 → 서버 저장(POST /api/community/notice-setting/{contentId}).
   *
   * 종 아이콘은 탭 즉시 뒤집되(반응성), 안내 토스트는 서버가 저장을 확정한 뒤에 띄운다 —
   * 낙관적으로 먼저 띄우면 실패 시 "받아요" 다음에 "실패했습니다"가 겹쳐 상반된 안내가 된다.
   * 게시글 상세의 종과 같은 규칙이다.
   */
  async function toggleAlarm() {
    if (alarmPending) return;

    const previous = alarmOn;
    const next = !previous;
    setAlarmOn(next);

    // 예시(데모)에선 네트워크 없이 토스트만(저장·롤백 없음).
    if (demo) {
      toast.show(alarmToast(next));
      return;
    }

    setAlarmPending(true);
    try {
      const response = await bffFetch(
        `/api/community/notice-setting/${contentId}`,
        { method: "POST" },
      );

      if (!response.ok) {
        if (response.status === 401) {
          postToNative({ type: OutboundMessageType.AUTH_LOGIN_PROMPT });
        }
        throw new Error(`notice request failed: ${response.status}`);
      }

      // 서버가 현재 설정을 뒤집어 결과(enabled)를 돌려주는 토글이라, 다른 화면·기기에서 이미
      // 바뀌어 있었다면 결과가 next와 다를 수 있다 → 응답 값을 진실로 삼는다.
      const body = (await response.json().catch(() => null)) as
        | { data?: { enabled?: boolean } }
        | null;
      const enabled =
        typeof body?.data?.enabled === "boolean" ? body.data.enabled : next;

      setAlarmOn(enabled);
      toast.show(alarmToast(enabled));
    } catch {
      setAlarmOn(previous);
      toast.show("알림 설정에 실패했습니다");
    } finally {
      setAlarmPending(false);
    }
  }

  return (
    <AppBarShell>
      {/* 우측 정렬 — 게시글 상세 앱바와 같은 규격(40x40, 아이콘 24). ⋮가 없어 종 하나만 놓인다. */}
      <div className="ml-auto flex items-center">
        <button
          type="button"
          onClick={() => void toggleAlarm()}
          aria-label={alarmOn ? "알림 끄기" : "알림 켜기"}
          aria-pressed={alarmOn}
          disabled={alarmPending}
          className="inline-flex size-10 items-center justify-center text-icon-primary"
        >
          {alarmOn ? <BellIcon size={24} /> : <BellOffIcon size={24} />}
        </button>
      </div>
    </AppBarShell>
  );
}
