import {
  addDays,
  isDateKey,
  type CompetitionRegistration,
} from "@/features/competition/domain/competition-registration";

/**
 * 관심 대회 마감 알림 규칙 (#375~#377).
 *
 * 알림은 마감 전날 저녁에 한 번 간다 — 얼리버드 마감 전날, 접수 마감 전날. 날짜는 모두 한국 날짜 "YYYY-MM-DD".
 * 보내는 것은 서버(푸시)이고, 웹은 "언제 오는지" 보여 주고 받을지 고르게 한다.
 */

/** 어느 마감 알림인지 — 얼리버드 마감 · 접수 마감. */
export type CompetitionDeadlineKind = "early-bird" | "final";

export type CompetitionDeadlineAlert = {
  kind: CompetitionDeadlineKind;
  /** 마감일 */
  deadline: string;
  /** 알림이 가는 날 — 마감 전날 */
  alertOn: string;
};

/**
 * 서버가 마감 알림을 보내는 시각(한국 시각, 시) — 매일 이 시각에 한 번, 내일이 마감인 관심 대회에 보낸다
 * (backend `competition.deadline-notice.cron`). 그 뒤에 관심 등록한 대회의 내일 마감은 보내지 않는다(#548).
 * 서버 설정이 바뀌면 같이 바꾼다.
 */
export const DEADLINE_ALERT_SEND_HOUR = 18;

/** 지금 한국 시각 — 날짜 "YYYY-MM-DD"와 시(0~23). 오늘 알림이 이미 나갔는지 가른다. */
export type DeadlineAlertClock = {
  today: string;
  hour: number;
};

/**
 * 아직 갈 마감 알림 — 얼리버드 먼저, 날짜순.
 *
 * 알림 날(마감 전날)이 이미 지났으면 뺀다 — 보내지 않을 날을 약속하지 않는다. 오늘이 알림 날이면
 * 보내는 시각(DEADLINE_ALERT_SEND_HOUR) 전에만 남긴다 — 그 뒤 등록분은 서버가 보내지 않는다(#548).
 * 얼리버드 마감이 접수 마감과 같은 날이면 접수 마감 하나로 본다.
 */
export function upcomingDeadlineAlerts(
  registration: CompetitionRegistration | undefined,
  clock: DeadlineAlertClock,
): CompetitionDeadlineAlert[] {
  return deadlineAlertsOf(registration).filter((alert) =>
    stillToCome(alert, clock),
  );
}

/**
 * 오늘 알림이 이미 나가서 이 대회에 남은 알림이 없는지 — 내일 마감인 대회를 보내는 시각 뒤에 고른 경우.
 * 이때는 받을지 묻지 않고 바로 알린다(#548). 일정 미정 · 이미 지난 마감은 해당하지 않는다.
 */
export function deadlineAlertsPassedToday(
  registration: CompetitionRegistration | undefined,
  clock: DeadlineAlertClock,
): boolean {
  if (clock.hour < DEADLINE_ALERT_SEND_HOUR) return false;
  const alerts = deadlineAlertsOf(registration);
  return (
    alerts.some((alert) => alert.alertOn === clock.today) &&
    !alerts.some((alert) => stillToCome(alert, clock))
  );
}

function deadlineAlertsOf(
  registration: CompetitionRegistration | undefined,
): CompetitionDeadlineAlert[] {
  if (!registration) return [];
  const { earlyBirdClosesOn: earlyBird, closesOn } = registration;
  const final = closesOn && isDateKey(closesOn) ? closesOn : undefined;

  const alerts: CompetitionDeadlineAlert[] = [];
  if (earlyBird && isDateKey(earlyBird) && (!final || earlyBird < final)) {
    alerts.push(alertFor("early-bird", earlyBird));
  }
  if (final) alerts.push(alertFor("final", final));
  return alerts;
}

function stillToCome(
  alert: CompetitionDeadlineAlert,
  { today, hour }: DeadlineAlertClock,
): boolean {
  if (alert.alertOn > today) return true;
  return alert.alertOn === today && hour < DEADLINE_ALERT_SEND_HOUR;
}

function alertFor(
  kind: CompetitionDeadlineKind,
  deadline: string,
): CompetitionDeadlineAlert {
  return { kind, deadline, alertOn: addDays(deadline, -1) };
}

/** 이 대회의 알림이 지금 의미가 있는지 — 남은 알림이 없으면 더 갈 알림이 없다. 일정 미정이면 나중에 생긴다. */
export function canReceiveDeadlineAlerts(
  registration: CompetitionRegistration | undefined,
  clock: DeadlineAlertClock,
): boolean {
  if (!registration?.closesOn && !registration?.earlyBirdClosesOn) return true;
  return upcomingDeadlineAlerts(registration, clock).length > 0;
}

/**
 * 관심 대회 알림 설정 — 앱 설정의 '관심 대회 알림'(jiu-jitsu-ios#255)과 같은 서버 값(GET /notice/setting).
 *
 * enabled가 켜져 있어야 알림이 가고, 그 안에서 대회마다 끌 수 있다(대회의 noticeEnabled, #376). 대회를 꺼도 관심은 그대로다.
 */
export type CompetitionAlertSettings = {
  /** 관심 대회 알림 전체. 처음에는 꺼짐 — 첫 관심 등록 시트(#375)에서 켠다. */
  enabled: boolean;
  /** 첫 관심 등록 때 이미 물어봤는지. 둘 다 false일 때만 시트를 띄운다. */
  asked: boolean;
};

/** 이 대회 알림을 켜고 끈 결과 — 켜면 관심도 함께 등록되므로 관심 표시도 이 값으로 맞춘다. */
export type CompetitionNoticeResult = {
  interested: boolean;
  interestCount: number;
  noticeEnabled: boolean;
};
