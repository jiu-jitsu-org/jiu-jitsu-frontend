import {
  competitionAlertNotificationId,
  DEFAULT_COMPETITION_ALERT_SETTINGS,
  type CompetitionAlertNotification,
  type CompetitionAlertSettings,
} from "@/features/competition/domain/competition-alert";
import type { CompetitionAlertRepository } from "@/features/competition/domain/competition-alert-repository";

/**
 * 관심 대회 알림 API가 나오기 전까지 쓰는 저장소 (#375~#377).
 *
 * 관심 등록 가짜 저장소처럼 로그인한 사용자는 누구나 같은 "나"로 보고, 서버 메모리에 둔다(다시 켜면 처음 상태).
 * 설정은 기본값(꺼짐)에서 시작한다. 알림함에는 예시 알림 두 건을 깔아 둔다 — 안 읽음 · 읽음이 함께 보이게.
 * 예시 알림은 실제로 보낸 알림이 아니다. 알림을 보내는 것은 앱·백엔드 몫이라 웹이 지어내지 않는다.
 * API가 나오면 External 저장소로 바꿔 끼우고 이 파일은 지운다.
 */

const SAMPLE_NOTIFICATIONS: CompetitionAlertNotification[] = [
  sample(
    "seoul-open-championship",
    "서울 오픈 챔피언십",
    "early-bird",
    "2026-11-09",
    "2026-11-08T18:00:00+09:00",
    false,
  ),
  sample(
    "gyeonggi-governor-cup",
    "제1회 경기도지사배 생활체육 주짓수 오픈 챔피언십",
    "early-bird",
    "2026-11-06",
    "2026-11-05T18:00:00+09:00",
    true,
  ),
];

function sample(
  competitionId: string,
  competitionName: string,
  kind: CompetitionAlertNotification["kind"],
  deadline: string,
  createdAt: string,
  isRead: boolean,
): CompetitionAlertNotification {
  return {
    id: competitionAlertNotificationId(competitionId, kind),
    competitionId,
    competitionName,
    kind,
    deadline,
    isRead,
    createdAt,
  };
}

type Store = {
  enabled: boolean;
  muted: Set<string>;
  readIds: Set<string>;
};

const STORE_KEY = Symbol.for("oss.fixture.competition-alerts");

/** Server Action과 페이지가 서로 다른 번들에서 이 모듈을 따로 읽을 수 있어 상태는 globalThis에 둔다. */
function store(): Store {
  const scope = globalThis as typeof globalThis & { [STORE_KEY]?: Store };
  scope[STORE_KEY] ??= {
    enabled: DEFAULT_COMPETITION_ALERT_SETTINGS.enabled,
    muted: new Set(DEFAULT_COMPETITION_ALERT_SETTINGS.mutedIds),
    readIds: new Set(
      SAMPLE_NOTIFICATIONS.filter((item) => item.isRead).map((item) => item.id),
    ),
  };
  return scope[STORE_KEY];
}

export class FixtureCompetitionAlertRepository implements CompetitionAlertRepository {
  async getSettings(): Promise<CompetitionAlertSettings> {
    const { enabled, muted } = store();
    return { enabled, mutedIds: [...muted] };
  }

  async setEnabled(enabled: boolean): Promise<void> {
    store().enabled = enabled;
  }

  async setMuted(competitionId: string, muted: boolean): Promise<void> {
    const ids = store().muted;
    if (muted) ids.add(competitionId);
    else ids.delete(competitionId);
  }

  async getNotifications(): Promise<CompetitionAlertNotification[]> {
    const { readIds } = store();
    return SAMPLE_NOTIFICATIONS.map((item) => ({
      ...item,
      isRead: readIds.has(item.id),
    })).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async markRead(ids?: readonly string[]): Promise<void> {
    const { readIds } = store();
    for (const id of ids ?? SAMPLE_NOTIFICATIONS.map((item) => item.id)) {
      readIds.add(id);
    }
  }
}
