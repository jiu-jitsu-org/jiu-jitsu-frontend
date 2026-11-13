"use client";

import { useRef, useState } from "react";

import { useLoginGuard } from "@/features/community/presentation/use-login-guard";
import { useNativeDialog } from "@/features/community/presentation/use-native-dialog";
import {
  COMPETITION_INFO_REPORT_DAILY_LIMIT,
  COMPETITION_INFO_REPORT_DETAIL_MAX_LENGTH,
  COMPETITION_INFO_REPORT_REASONS,
  isCompetitionInfoReportReason,
  requiresReportDetail,
} from "@/features/competition/domain/competition-info-report";
import { reportCompetitionInfoAction } from "@/features/competition/presentation/actions/report-competition-info-action";
import { fullDateLabel } from "@/features/competition/presentation/competition-detail-format";
import { useAuth } from "@/features/auth/presentation/auth-provider";
import { cn } from "@/shared/lib/cn";
import { COMPETITION_GONE_MESSAGE } from "@/features/community/presentation/notifications/inbox-copy";
import { useToast } from "@/shared/ui";
import { SURFACE_PRESS } from "@/shared/ui/press-styles";

/**
 * 정보 기준 (#365) — 언제 무엇(대회 공지)을 기준으로 적었는지 · "잘못된 정보 알려 주기" 제보.
 *
 * "바뀔 수 있어요"처럼 책임을 미루는 말 대신 확인한 날과 기준을 밝히고, 다른 점은 바로 알려 달라고 한다.
 * 제보 버튼은 "정보가 달라요"(상태) 대신 동작으로 끝나는 말이라 누르는 자리로 읽힌다.
 *
 * 같은 대회의 마감일이 서비스마다 다른 일이 있어 얼마나 믿을지 스스로 판단하게 기준을 밝힌다.
 * 확인하지 못한 대회는 대회 공지에서 확인하라고 먼저 말한다.
 * 제보는 커뮤니티 신고와 같은 선택 시트(앱이면 앱이 그리는 시트)로 무엇이 다른지 하나 고르고, 맞는 정보를 아시면 적는다(#420).
 * 적는 칸은 "다른 정보"만 꼭 채워야 한다. 같은 항목은 하루 3번까지라 넘으면 토스트로 알린다.
 */
export function CompetitionInfoBasis({
  competitionId,
  verifiedOn,
}: {
  competitionId: number;
  verifiedOn?: string;
}) {
  const { guard } = useLoginGuard();
  const { promptLogin } = useAuth();
  const { selectSheet, dialog } = useNativeDialog();
  const toast = useToast();
  const [sending, setSending] = useState(false);
  // 시트가 뜨기 전 짧은 틈에 두 번 눌러도 시트·제보가 한 번만 가게 잠근다.
  const busy = useRef(false);

  async function report() {
    if (busy.current) return;
    busy.current = true;
    try {
      await reportOnce();
    } finally {
      busy.current = false;
    }
  }

  async function reportOnce() {
    const outcome = await selectSheet({
      title: "어떤 정보가 다른가요?",
      message: "알려 주시면 대회 공지와 다시 맞춰 볼게요.",
      options: COMPETITION_INFO_REPORT_REASONS.map((reason) => ({ ...reason })),
      customTextPlaceholder: "아시면 맞는 정보를 적어 주세요.",
      customTextMaxLength: COMPETITION_INFO_REPORT_DETAIL_MAX_LENGTH,
      submitText: "보내기",
    });
    if (!outcome.submitted || !outcome.value) return;
    // "다른 정보"는 고른 항목만으로 무엇이 다른지 알 수 없어 꼭 적어야 한다 — 보내기 전에 알린다.
    if (
      isCompetitionInfoReportReason(outcome.value) &&
      requiresReportDetail(outcome.value) &&
      !outcome.customText?.trim()
    ) {
      toast.show("어떤 정보가 다른지 적어 주세요", { tone: "info" });
      return;
    }

    setSending(true);
    try {
      const result = await reportCompetitionInfoAction(
        competitionId,
        outcome.value,
        outcome.customText,
      );
      if (!result.ok && result.reason === "unauthenticated") {
        promptLogin({ reason: "대회 정보 제보" });
        return;
      }
      if (!result.ok && result.reason === "limit") {
        toast.show(
          `같은 항목은 하루 ${COMPETITION_INFO_REPORT_DAILY_LIMIT}번까지 알려 주실 수 있어요`,
          { tone: "info" },
        );
        return;
      }
      if (!result.ok && result.reason === "not-found") {
        toast.show(COMPETITION_GONE_MESSAGE, { tone: "info" });
        return;
      }
      if (!result.ok && result.reason === "detail-required") {
        toast.show("어떤 정보가 다른지 적어 주세요", { tone: "info" });
        return;
      }
      if (!result.ok) throw new Error(result.reason);
      toast.show("알려 주셔서 고마워요. 확인하고 고칠게요", { tone: "success" });
    } catch {
      toast.show("보내지 못했어요. 다시 눌러 주세요", { tone: "error" });
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="px-5 pt-4 text-[13px] leading-[18px] text-text-tertiary">
      <p>
        {verifiedOn ? (
          <>
            <span className="tabular-nums">{fullDateLabel(verifiedOn)}</span>{" "}
            대회 공지 기준이에요
          </>
        ) : (
          "아직 확인 전인 정보라 대회 공지를 꼭 봐 주세요."
        )}
      </p>
      <div className="mt-0.5 flex items-center">
        <button
          type="button"
          disabled={sending}
          onClick={() =>
            guard(
              () => void report(),
              "정보 제보는 OSS 앱에서 로그인 후 할 수 있어요.",
            )()
          }
          className={cn(
            "-mx-1 -my-3 min-h-11 rounded-10 px-1 font-semibold text-text-secondary disabled:text-text-disabled",
            SURFACE_PRESS,
          )}
        >
          잘못된 정보 알려 주기 ›
        </button>
      </div>
      {dialog}
    </section>
  );
}
