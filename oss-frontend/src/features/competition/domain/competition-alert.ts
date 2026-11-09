import {
  isDateKey,
  type CompetitionRegistration,
} from "@/features/competition/domain/competition-registration";

/**
 * 관심 대회 마감 알림 규칙 (#375~#377).
 *
 * 알림은 마감 전날 저녁에 한 번 간다 — 얼리버드 마감 전날, 접수 마감 전날. 날짜는 모두 한국 날짜 "YYYY-MM-DD".
 * 보내는 것은 앱(푸시)이고, 웹은 "언제 오는지" 보여 주고 받을지 고르게 한다.
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
 * 오늘 이후에 갈 마감 알림 — 얼리버드 먼저, 날짜순.
 *
 * 알림 날(마감 전날)이 이미 지났으면 뺀다 — 보내지 않을 날을 약속하지 않는다. 오늘이 알림 날이면 남긴다(저녁에 간다).
 * 얼리버드 마감이 접수 시작보다 이르거나 접수 마감보다 늦은 값은 실제로 없는 날이라 무시한다(목록 규칙과 같다).
 */
export function upcomingDeadlineAlerts(
  registration: CompetitionRegistration | undefined,
  today: string,
): CompetitionDeadlineAlert[] {
  if (
    !registration ||
    !isDateKey(registration.opensOn) ||
    !isDateKey(registration.closesOn) ||
    registration.opensOn > registration.closesOn
  ) {
    return [];
  }

  const alerts: CompetitionDeadlineAlert[] = [];
  const earlyBird = registration.earlyBirdClosesOn;
  if (
    earlyBird &&
    isDateKey(earlyBird) &&
    earlyBird >= registration.opensOn &&
    earlyBird < registration.closesOn
  ) {
    alerts.push(alertFor("early-bird", earlyBird));
  }
  alerts.push(alertFor("final", registration.closesOn));
  return alerts.filter((alert) => alert.alertOn >= today);
}

function alertFor(
  kind: CompetitionDeadlineKind,
  deadline: string,
): CompetitionDeadlineAlert {
  return { kind, deadline, alertOn: previousDay(deadline) };
}

/** 하루 전 한국 날짜. 날짜만 있는 값이라 UTC 자정으로 놓고 빼면 서머타임 걱정이 없다. */
export function previousDay(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day - 1))
    .toISOString()
    .slice(0, 10);
}

/** 이 대회의 알림이 지금 의미가 있는지 — 접수 마감이 지났으면 더 갈 알림이 없다. 일정 미정이면 나중에 생긴다. */
export function canReceiveDeadlineAlerts(
  registration: CompetitionRegistration | undefined,
  today: string,
): boolean {
  if (!registration) return true;
  return upcomingDeadlineAlerts(registration, today).length > 0;
}

/**
 * 관심 대회 알림 설정 — 앱 설정의 '관심 대회 알림'(jiu-jitsu-ios#255)과 같은 값.
 *
 * enabled가 켜져 있어야 알림이 가고, 그 안에서 대회마다 끌 수 있다(mutedIds, #376). 대회를 꺼도 관심은 그대로다.
 */
export type CompetitionAlertSettings = {
  /** 관심 대회 알림 전체. 기본값은 꺼짐 — 첫 관심 등록 시트(#375)에서 켠다. */
  enabled: boolean;
  /** 알림만 끈 대회 id — 신청을 마친 대회처럼 관심은 두고 알림만 멈춘다. */
  mutedIds: string[];
};

export const DEFAULT_COMPETITION_ALERT_SETTINGS: CompetitionAlertSettings = {
  enabled: false,
  mutedIds: [],
};

/**
 * 알림함에 쌓인 대회 마감 알림 한 건(#377). 커뮤니티 알림과 같은 목록에 최신순으로 섞인다.
 */
export type CompetitionAlertNotification = {
  /** 대회와 마감 종류로 정해지는 키 — 같은 마감 알림은 한 번만 간다. */
  id: string;
  competitionId: string;
  competitionName: string;
  kind: CompetitionDeadlineKind;
  /** 마감일 */
  deadline: string;
  isRead: boolean;
  /** 보낸 때(ISO 8601, 오프셋 명시) */
  createdAt: string;
};

export function competitionAlertNotificationId(
  competitionId: string,
  kind: CompetitionDeadlineKind,
): string {
  return `${competitionId}:${kind}`;
}

/** 알림 제목 "얼리버드 마감 내일" — 보낸 날 기준. 마감 당일·지난 뒤 다시 봐도 보낸 때의 말 그대로 둔다. */
export function deadlineAlertTitle(kind: CompetitionDeadlineKind): string {
  return kind === "early-bird" ? "얼리버드 마감 내일" : "접수 마감 내일";
}

/** 알림 본문 "서울 오픈 챔피언십 얼리버드가 내일 끝나요" */
export function deadlineAlertBody(
  competitionName: string,
  kind: CompetitionDeadlineKind,
): string {
  return kind === "early-bird"
    ? `${competitionName} 얼리버드가 내일 끝나요`
    : `${competitionName} 접수가 내일 끝나요`;
}
