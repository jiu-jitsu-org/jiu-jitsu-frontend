"use client";

import { useState } from "react";

import { AppBarShell } from "@/features/community/presentation/app-bar-shell";
import { closeDetail } from "@/features/community/presentation/close-detail";
import { REACTION_PRESS_MOTION } from "@/features/community/presentation/comment-reaction-styles";
import { OpenInAppBanner } from "@/features/community/presentation/open-in-app-banner";
import { shareCurrentPage } from "@/features/community/presentation/share-current-page";
import { useLoginGuard } from "@/features/community/presentation/use-login-guard";
import { useCompetitionAlerts } from "@/features/competition/presentation/competition-alert-provider";
import type { CompetitionAlertTarget } from "@/features/competition/presentation/competition-alert-sheet";
import { useCompetitionDetailInterest } from "@/features/competition/presentation/competition-detail-interest";
import { cn } from "@/shared/lib/cn";
import { useIsExternalBrowser } from "@/shared/lib/native-bridge";
import { useToast } from "@/shared/ui";
import { IconButton } from "@/shared/ui/icon-button";
import {
  BackArrowIcon,
  BellIcon,
  BellOffIcon,
  ShareIcon,
} from "@/shared/ui/icons";

/**
 * 대회 상세 머리 (#361 · #369 · #376) — 게시글 상세와 같은 앱바: 왼쪽 뒤로 가기, 오른쪽 이 대회 알림 · 공유.
 *
 * 공유는 게시글과 같은 길(shareCurrentPage — OS 공유 시트 → 앱 브릿지 → 링크 복사)이다.
 * 앱 밖 브라우저(공유 링크로 들어온 사람)는 앱바 대신 '앱으로 보기' 배너다 — 게시글 상세와 같다(#72).
 * alertTarget이 없으면(불러오기 실패·더 올 마감 알림이 없는 대회) 알림 종을 두지 않는다.
 */
export function CompetitionDetailHeader({
  alertTarget,
  noticeEnabled = false,
}: {
  alertTarget?: CompetitionAlertTarget;
  /**
   * 관심 등록돼 있다면 이 대회 알림이 켜져 있는지 — 상세 응답의 noticeEnabled(#422).
   * 관심이 없던 대회는 관심을 새로 등록하면 알림이 켜진 채로 생겨 true로 넘긴다.
   */
  noticeEnabled?: boolean;
}) {
  const externalBrowser = useIsExternalBrowser();
  if (externalBrowser) return <OpenInAppBanner />;

  return (
    <AppBarShell>
      <IconButton onClick={closeDetail} aria-label="뒤로 가기">
        <BackArrowIcon size={24} />
      </IconButton>
      <div className="ml-auto flex items-center">
        {alertTarget ? (
          <CompetitionAlertButton
            target={alertTarget}
            noticeEnabled={noticeEnabled}
          />
        ) : null}
        <IconButton
          onClick={() => void shareCurrentPage()}
          aria-label="대회 공유하기"
        >
          {/* 24px에서 선이 2px이 되게(16 viewBox × 1.5) — 뒤로 가기·알림 종과 같은 굵기. */}
          <ShareIcon size={24} strokeWidth={4 / 3} />
        </IconButton>
      </div>
    </AppBarShell>
  );
}

/**
 * 이 대회 알림 켜기·끄기 (#376) — 글 상세의 알림 종과 같은 자리 · 같은 모양 · 같은 움직임.
 *
 * 켜져 있다 = 관심 등록 + 설정의 '관심 대회 알림' 켜짐 + 이 대회 알림 켜짐(noticeEnabled) — 실제로 알림이 가는 조건(#422).
 * 끄기: 관심은 그대로 두고 이 대회 알림만 멈춘다 — 신청을 마친 대회처럼(DELETE /competitions/{id}/notice).
 * 켜기: PUT /competitions/{id}/notice — 관심이 없으면 서버가 관심도 함께 등록하고, 돌려준 관심 상태로 관심 버튼을 맞춘다.
 *   설정이 꺼져 있으면 마감 알림 시트를 다시 띄운다(#375).
 * 비로그인은 글 상세처럼 종을 두지 않는다.
 */
function CompetitionAlertButton({
  target,
  noticeEnabled,
}: {
  target: CompetitionAlertTarget;
  noticeEnabled: boolean;
}) {
  const { guest } = useLoginGuard();
  const interest = useCompetitionDetailInterest();
  const alerts = useCompetitionAlerts();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  // 누를 때마다 움직임을 다시 튼다(글 상세 종과 같다). 처음 그릴 때는 움직이지 않는다.
  const [turn, setTurn] = useState(0);
  // 이 화면에서 켜고 끈 값. 없으면 서버 값.
  const [noticeOverride, setNoticeOverride] = useState<boolean | null>(null);
  // 관심을 껐다 다시 켜면 서버는 이 대회 알림이 켜진 관심을 새로 만든다 — 종도 켜진 것으로 맞춘다.
  const interested = interest.isInterested(target.id);
  const [wasInterested, setWasInterested] = useState(interested);
  if (wasInterested !== interested) {
    setWasInterested(interested);
    if (interested) setNoticeOverride(true);
  }

  if (guest || !alerts?.available) return null;

  const noticeOn = noticeOverride ?? noticeEnabled;
  const on = interested && alerts.enabled && noticeOn;

  async function toggle() {
    if (!alerts || pending) return;
    setPending(true);
    try {
      if (on) {
        if (await alerts.setNotice(target.id, false)) {
          setNoticeOverride(false);
          setTurn((value) => value + 1);
          toast.show("이 대회의 알림을 받지 않아요", { tone: "info" });
        }
        return;
      }
      const result = await alerts.setNotice(target.id, true);
      if (!result) return;
      interest.apply(target.id, result.interested, result.interestCount);
      setNoticeOverride(result.noticeEnabled);
      if (!alerts.enabled) {
        alerts.ask(target);
        return;
      }
      setTurn((value) => value + 1);
      toast.show("이 대회의 알림을 받아요", { tone: "info" });
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      aria-label={on ? "이 대회 알림 끄기" : "이 대회 알림 켜기"}
      aria-pressed={on}
      disabled={pending}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full text-icon-primary active:bg-surface-container-pressed",
        REACTION_PRESS_MOTION,
      )}
    >
      {/* 켜면 꼭대기를 축으로 땡그랑 흔들리고, 끄면 움츠렸다 돌아온다. */}
      <span
        key={turn}
        className={cn(
          "inline-flex",
          turn > 0 &&
            (on
              ? "origin-top motion-safe:animate-bell-ring"
              : "motion-safe:animate-bell-mute"),
        )}
      >
        {on ? <BellIcon size={24} /> : <BellOffIcon size={24} />}
      </span>
    </button>
  );
}
