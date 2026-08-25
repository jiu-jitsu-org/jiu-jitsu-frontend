"use client";

import { useCallback } from "react";

import {
  REPORT_REASONS,
  type ReportTargetType,
} from "@/features/community/domain/report";
import { useIsDemoMode } from "@/features/community/presentation/community-demo-context";
import { useNativeDialog } from "@/features/community/presentation/use-native-dialog";
import { bffFetch } from "@/shared/lib/http/bff-fetch";
import { OutboundMessageType, postToNative } from "@/shared/lib/native-bridge";
import { useToast } from "@/shared/ui";

/**
 * 신고 플로우 — 확인 알럿 → 사유 시트 → POST /reports.
 *
 * 피드 카드 ⋮와 상세 앱바 ⋮가 같은 흐름을 쓰므로 훅으로 모은다(문구가 갈리면 같은 글인데
 * 진입 지점에 따라 다른 경험이 된다).
 *
 * 알럿·시트 표면은 useNativeDialog가 "네이티브 우선, 없으면 웹"으로 처리한다 — 앱에서는 GNB·하단
 * 탭바까지 덮는 딤이 필요해 네이티브가 그려야 한다. 계약: docs/native-dialog-bridge.md
 *
 * 성공 토스트를 훅이 직접 띄우지 않고 `onReported`로 넘길 수 있게 둔 이유: 상세처럼 신고 직후
 * 화면이 닫히는 진입점에서는 이 화면에 띄운 토스트가 웹뷰와 함께 사라져 사용자가 못 본다.
 * 문구는 훅이 계속 소유하고(진입점마다 갈리면 안 됨), "어디에 띄울지"만 호출부가 정한다.
 *
 * @returns report(신고 처리 여부를 반환) + 웹 폴백 UI(`dialog`, 트리에 렌더 필요)
 */
export function useReportFlow() {
  const toast = useToast();
  const demo = useIsDemoMode();
  const { confirm, selectSheet, dialog } = useNativeDialog();

  /** 성공 문구를 호출부에 넘기거나(화면이 닫히는 진입점), 없으면 여기서 띄운다. */
  const notifyReported = useCallback(
    (message: string, onReported?: (message: string) => void) => {
      if (onReported) onReported(message);
      else toast.show(message);
    },
    [toast],
  );

  const report = useCallback(
    async (
      target: {
        reportType: ReportTargetType;
        targetId: number;
      },
      options?: {
        /**
         * 신고가 처리로 확정됐을 때(신규 접수·중복 신고 공통) 호출된다. 인자는 노출할 문구.
         * 넘기지 않으면 훅이 현재 화면에 그대로 토스트를 띄운다.
         */
        onReported?: (message: string) => void;
      },
    ): Promise<boolean> => {
      const isPost = target.reportType === "BOARD";
      const noun = isPost ? "게시글" : "댓글";

      const confirmed = await confirm({
        title: `${noun} 신고`,
        message: `신고된 ${noun}은 검토 후 처리돼요.`,
        confirmText: "신고",
        destructive: true,
      });
      if (!confirmed) return false;

      const outcome = await selectSheet({
        title: "어떤 문제인가요?",
        message: "신고는 익명으로 처리되며, 검토 후 조치돼요.",
        options: REPORT_REASONS,
        customTextPlaceholder: "신고할 내용을 입력해주세요.",
        submitText: "신고하기",
      });
      if (!outcome.submitted || !outcome.value) return false;

      // 예시(데모)에선 네트워크 없이 안내만(실제 신고 없음).
      if (demo) {
        notifyReported(`${noun}을 신고했습니다`, options?.onReported);
        return true;
      }

      // FIXME(계약): "기타"로 입력한 상세 내용(outcome.customText)을 실을 필드가 요청 스키마에 없다.
      // 지금은 reason 코드만 전송되고 입력 내용은 버려진다 — 백엔드에 상세 필드 추가 후 함께 싣는다.
      const response = await bffFetch("/api/community/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType: target.reportType,
          targetId: target.targetId,
          reason: outcome.value,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          postToNative({ type: OutboundMessageType.AUTH_LOGIN_PROMPT });
        }
        // 동일 대상 중복 신고는 서버가 막는다(409). 이미 신고한 상태이므로 호출부는 성공과 동일하게
        // 후처리(목록에서 감추기)한다 — 계속 보이는 편이 더 어색하다.
        if (response.status === 409) {
          notifyReported(`이미 신고한 ${noun}이에요`, options?.onReported);
          return true;
        }
        toast.show(`${noun} 신고에 실패했습니다`);
        return false;
      }

      notifyReported(`${noun}을 신고했습니다`, options?.onReported);
      return true;
    },
    [confirm, demo, notifyReported, selectSheet, toast],
  );

  return { report, dialog };
}
