"use client";

import { BottomSheetFrame } from "@/features/community/presentation/bottom-sheet-frame";
import {
  upcomingDeadlineAlerts,
  type CompetitionDeadlineKind,
} from "@/features/competition/domain/competition-alert";
import type { CompetitionRegistration } from "@/features/competition/domain/competition-registration";
import { shortDateLabel } from "@/features/competition/presentation/competition-detail-format";
import { weekdayOf } from "@/features/competition/presentation/competition-month-section";
import { Button } from "@/shared/ui/button";

/** 시트가 묻는 대회 — 이름과 접수 일정으로 알림 날을 보여 준다. */
export type CompetitionAlertTarget = {
  id: string;
  name: string;
  registration?: CompetitionRegistration;
};

const DEADLINE_LABEL: Record<CompetitionDeadlineKind, string> = {
  "early-bird": "얼리버드 마감 전날",
  final: "접수 마감 전날",
};

/**
 * 관심 대회 마감 알림 시트 (#375) — "이 대회 마감 알림을 받을까요?"
 *
 * 처음 관심 등록할 때 한 번 묻는다. 무엇을 언제 받는지 알아야 정할 수 있어, 이 대회에 남은 마감 전날을 줄로 보여 준다.
 * 지난 마감은 빼고, 남은 마감이 없으면(접수 일정 미정 등) 날짜 없이 묻는다.
 * '알림 받기'는 설정의 '관심 대회 알림'을 켜는 것이라 이 대회만이 아니라 관심 대회 전체에 해당한다 — 아래 한 줄로 알린다.
 * 띠 묻기 시트와 같은 껍데기·같은 버튼 두 개(채운 버튼 + 글자 버튼)다.
 */
export function CompetitionAlertSheet({
  target,
  open,
  today,
  onAccept,
  onLater,
}: {
  /** 닫히는 동안에도 내용이 비지 않게 마지막 대회를 그대로 넘긴다. */
  target: CompetitionAlertTarget | null;
  open: boolean;
  /** 한국 날짜 "YYYY-MM-DD" — 지난 마감을 뺀다. */
  today: string;
  onAccept: () => void;
  /** '나중에'와 바깥 탭 모두 여기로 온다 — 관심은 그대로, 알림은 꺼진 채. */
  onLater: () => void;
}) {
  const alerts = target
    ? upcomingDeadlineAlerts(target.registration, today)
    : [];
  const currentYear = Number(today.slice(0, 4));

  return (
    <BottomSheetFrame
      open={open}
      title="이 대회 마감 알림을 받을까요?"
      message={
        target && alerts.length > 0
          ? `${target.name}${topicParticle(target.name)} 이날 알려 드려요`
          : undefined
      }
      onDismiss={onLater}
    >
      {alerts.length > 0 ? (
        <ul className="mt-4 rounded-2xl bg-surface-field px-4 py-1">
          {alerts.map((alert) => (
            <li
              key={alert.kind}
              className="flex h-11 items-center justify-between gap-3 text-[15px] leading-[22px]"
            >
              <span className="text-text-secondary-strong">
                {DEADLINE_LABEL[alert.kind]}
              </span>
              <span className="font-semibold text-text-primary tabular-nums">
                {shortDateLabel(alert.alertOn, currentYear)}(
                {weekdayOf(alert.alertOn).label})
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 text-body-s text-text-secondary">
        관심 등록한 다른 대회도 마감 전날 알려 드려요
      </p>

      <Button variant="cta" size="l" onClick={onAccept} className="mt-6 w-full">
        알림 받기
      </Button>
      <Button
        variant="cta-ghost"
        size="l"
        onClick={onLater}
        className="mt-2 w-full"
      >
        나중에
      </Button>
    </BottomSheetFrame>
  );
}

/**
 * 이름 뒤 "은/는" — 마지막 글자에 받침이 있으면 "은". 한글이 아니면(영문·숫자로 끝나는 이름) 받침을 알 수 없어 "은(는)".
 */
function topicParticle(name: string): string {
  const code = name.trim().charCodeAt(name.trim().length - 1);
  if (code < 0xac00 || code > 0xd7a3) return "은(는)";
  return (code - 0xac00) % 28 === 0 ? "는" : "은";
}
