"use client";

import { useState } from "react";

import { useIsDemoMode } from "@/features/community/presentation/community-demo-context";
import { bffFetch } from "@/shared/lib/http/bff-fetch";
import {
  MenuBox,
  MenuItem,
} from "@/features/community/presentation/menu-box";
import {
  OutboundMessageType,
  closeNativeSubview,
  isNativeBridgeAvailable,
  postToNative,
} from "@/shared/lib/native-bridge";
import { enqueuePendingToast, useToast } from "@/shared/ui";
import { AppBarShell } from "@/features/community/presentation/app-bar-shell";
import {
  HIDE_TOAST,
  POST_HIDDEN_ACTION,
  toggleHidePost,
} from "@/features/community/presentation/hide-post";
import { useNativeDialog } from "@/features/community/presentation/use-native-dialog";
import { useReportFlow } from "@/features/community/presentation/use-report-flow";
import {
  BellIcon,
  BellOffIcon,
  MoreVerticalIcon,
} from "@/shared/ui/icons";

/**
 * 상세 화면 상단 앱바 (클라이언트 leaf).
 *
 * 높이 44 고정, 하단 디바이더 없음, 배경 True White.
 * 우측: 알림종 + ⋮ 메뉴를 간격 0으로 붙여 우측 정렬(우 8). 뒤로가기는 네이티브 내비게이션이 담당.
 * 제목은 현재 비워둔다(추후 노출 시 가운데 영역에 추가).
 *
 * ⋮ 메뉴는 게시글 소유자 여부(isOwner)에 따라 수정/삭제 vs 신고를 노출하므로 웹이 소유한다
 * (네이티브가 그리면 소유자 컨텍스트를 브릿지로 왕복해야 함).
 *
 * 삭제 확인 알럿은 useNativeDialog가 "네이티브 우선, 없으면 웹"으로 띄운다 — 피드 카드 ⋮와 같은
 * 경로다. 무엇을 물어보고 확인 후 무엇을 호출할지는 여기(웹)가 그대로 쥔다.
 * 계약 상세: docs/native-dialog-bridge.md
 */
export function PostDetailAppBar({
  postId,
  isOwner,
  initialNoticeEnabled,
}: {
  postId: number;
  isOwner: boolean;
  initialNoticeEnabled: boolean;
}) {
  const toast = useToast();
  const demo = useIsDemoMode();
  const { confirm, dialog } = useNativeDialog();
  const { report, dialog: reportDialog } = useReportFlow();
  const [menuOpen, setMenuOpen] = useState(false);
  // 알림 받기 on/off. 초기값은 게시글의 noticeEnabled, 탭하면 서버에 저장한다(#46).
  const [alarmOn, setAlarmOn] = useState(initialNoticeEnabled);
  // 저장 중 재탭 방지 — 토글 엔드포인트라 연타하면 서버 상태가 화면과 어긋난 채로 뒤집힌다.
  const [alarmPending, setAlarmPending] = useState(false);

  // 네이티브 뒤로가기: 상세는 이탈 가드가 없어 BACK_GUARD를 통지하지 않는다 → 네이티브가 직접 닫는다.
  // (정상/에러 어느 화면이든 네이티브가 처리하므로 웹 측 back 코드가 필요 없다.)

  /**
   * 알림 받기 토글 → 서버 저장(POST /api/community/notice-setting/{contentId}).
   *
   * 종 아이콘은 탭 즉시 뒤집되(반응성), 안내 토스트는 서버가 저장을 확정한 뒤에 띄운다 —
   * 낙관적으로 먼저 띄우면 실패 시 "받아요" 다음에 "실패했습니다"가 겹쳐 상반된 안내가 된다.
   * 실패하면 아이콘을 원래 상태로 되돌린다(재진입 시 서버 값과 어긋나지 않도록).
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
        `/api/community/notice-setting/${postId}`,
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

  /** 삭제: 확인 알럿 → DELETE → 성공 시 완료 문구를 목록에 넘기고 상세를 닫는다. */
  async function handleDelete() {
    const confirmed = await confirm({
      title: "게시글 삭제",
      message: "삭제한 게시글은 복구할 수 없어요.",
      confirmText: "삭제",
      destructive: true,
    });
    if (!confirmed) return;

    // 예시(데모)에선 네트워크 없이 토스트만(실제 삭제/화면 닫기 없음).
    if (demo) {
      toast.show("게시물이 삭제되었습니다");
      return;
    }

    const response = await bffFetch(`/api/community/posts/${postId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      if (response.status === 401) {
        postToNative({ type: OutboundMessageType.AUTH_LOGIN_PROMPT });
      }
      toast.show("게시물 삭제에 실패했습니다");
      return;
    }

    // 닫히는 화면에 띄우면 토스트도 웹뷰와 함께 사라진다 → 문구만 넘기고 목록이 띄운다.
    enqueuePendingToast("게시물이 삭제되었습니다");
    // 카드 제거는 복귀 시 단건 재조회(404)가 처리한다(#73).
    closeDetail();
  }

  /**
   * 상세를 닫고 이전 화면(목록)으로 돌아간다.
   *
   * 앱은 상세가 별도 서브뷰 웹뷰라 네이티브가 팝해야 하고, 웹 단독 진입은 브라우저 히스토리를
   * 되돌린다 — 두 경우 모두 "직전 화면으로 복귀"라는 같은 결과가 된다.
   */
  function closeDetail() {
    if (isNativeBridgeAvailable()) {
      closeNativeSubview();
      return;
    }
    window.history.back();
  }

  /**
   * 신고: 확인 알럿 → 사유 시트 → POST(useReportFlow) → 처리되면 상세를 닫는다.
   *
   * 신고자 본인 화면에서는 그 콘텐츠가 즉시 사라져야 하는데(#48), 상세는 글 하나가 화면 전부라
   * 숨길 대상이 없다 → 삭제와 같이 화면을 닫는 것이 곧 비노출이다.
   *
   * 목록에서 카드가 사라지는 것은 여기서 신호를 보내지 않는다 — 상세 복귀 시 해당 게시글을
   * 단건 재조회해 비노출이면 걷어내는 경로(#73)가 담당한다. 서버 응답에서 신고한 글이 빠지는 것
   * 자체는 백엔드 몫이다(목록 페이징이 깨지므로 클라이언트에서 필터링하지 않는다).
   */
  /**
   * 숨기기: 확인 알럿 없이 즉시 처리하고 화면을 닫는다 — 목록 카드와 같은 정책(#51).
   *
   * 카드 제거와 되돌리기는 목록이 맡는다. 이 화면은 곧 닫히므로 여기 띄운 토스트는 사용자가 볼 수
   * 없고, 복원에 필요한 게시글 데이터 · 위치도 목록만 알고 있다. 그래서 "이 글을 숨겼다"는 사실만
   * 액션 서술자로 남긴다(함수는 웹뷰를 건너갈 수 없다).
   */
  async function handleHide() {
    // 예시(데모)에선 네트워크 없이 안내만(화면도 닫지 않는다).
    if (demo) {
      toast.show(HIDE_TOAST.done);
      return;
    }

    const hidden = await toggleHidePost(postId);
    if (!hidden) {
      toast.show(HIDE_TOAST.failed);
      return;
    }

    enqueuePendingToast(HIDE_TOAST.done, {
      label: HIDE_TOAST.undoLabel,
      type: POST_HIDDEN_ACTION,
      postId,
    });
    closeDetail();
  }

  async function handleReport() {
    await report(
      { reportType: "BOARD", targetId: postId },
      {
        onReported: (message) => {
          // 예시(데모)에선 화면을 닫지 않으므로 이 화면에서 바로 띄운다.
          if (demo) {
            toast.show(message);
            return;
          }

          // 닫히는 화면에 띄우면 토스트도 함께 사라진다 → 문구만 넘기고 목록이 띄운다.
          enqueuePendingToast(message);
          closeDetail();
        },
      },
    );
  }

  return (
    <AppBarShell>
      {/* 우측 그룹: 알림종 + ⋮ 를 간격 0으로 붙여 우측 정렬 */}
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

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="게시물 메뉴 열기"
            className="inline-flex size-10 items-center justify-center text-icon-primary"
          >
            <MoreVerticalIcon size={24} />
          </button>

        {menuOpen ? (
          <MenuBox placement="bottom-right" onClose={() => setMenuOpen(false)}>
            {/* 자신 게시글: 삭제/수정 · 타인 게시글: 신고/숨기기 */}
            {isOwner ? (
              <>
                <MenuItem
                  onClick={() => {
                    setMenuOpen(false);
                    void handleDelete();
                  }}
                >
                  삭제하기
                </MenuItem>
                <MenuItem onClick={() => setMenuOpen(false)}>수정하기</MenuItem>
              </>
            ) : (
              <>
                <MenuItem
                  onClick={() => {
                    setMenuOpen(false);
                    void handleReport();
                  }}
                >
                  신고하기
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setMenuOpen(false);
                    void handleHide();
                  }}
                >
                  숨기기
                </MenuItem>
              </>
            )}
          </MenuBox>
        ) : null}
        </div>
      </div>

      {/* 게시글 삭제 확인 알럿(웹 단독 폴백 전용 — 앱에서는 네이티브가 그린다) */}
      {dialog}

      {/* 신고 알럿·사유 시트(웹 단독 폴백 전용 — 앱에서는 네이티브가 그린다) */}
      {reportDialog}
    </AppBarShell>
  );
}

/** 알림 on/off 안내 문구 — 확정된 상태 기준으로만 만든다. */
function alarmToast(enabled: boolean): string {
  return enabled
    ? "이제부터 이 글의 알림을 받아요"
    : "이제부터 이 글의 알림을 받지 않아요";
}
