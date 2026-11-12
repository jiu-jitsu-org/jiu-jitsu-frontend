import type { Competition } from "@/features/competition/domain/competition";
import {
  daysBetween,
  isDateKey,
} from "@/features/competition/domain/competition-registration";

/**
 * 대회 탭 맨 위 결과 남기기 카드 규칙 (#403).
 *
 * 관심 등록한 대회가 끝나면 대회 탭 맨 위(곧 마감 배너 자리)에서 결과를 남길지 묻는다.
 * 대회 상세의 결과 남기기 배너(#368)와 같은 일을, 사람들이 자주 여는 대회 탭에서 끝난 직후 며칠만 한다.
 * 날짜는 모두 한국 날짜 "YYYY-MM-DD", "오늘"은 호출부가 서버 시각으로 정해 넘긴다.
 */

/** 끝난 뒤 카드를 보여 주는 날수 — 대회 다음 날부터 5일째까지. 토요일 대회는 하루 늘려 그 주 금요일까지. */
export const RESULT_CARD_DAYS = 5;

/** 카드 한 장 — 한 날(평일) 또는 같은 주말(토·일)에 끝난 관심 대회 묶음. */
export type ResultCardGroup = {
  /** 묶음 이름 — 평일이면 그 날짜, 주말이면 그 주 토요일 날짜 앞에 "weekend:". */
  key: string;
  /** 같은 주말에 끝났는지. 카드 제목을 "지난 주말"로 쓴다. */
  weekend: boolean;
  /** 묶음 안에서 가장 늦게 끝난 대회가 며칠 전인지(어제 = 1). */
  daysAgo: number;
  /** 날짜순, 같으면 이름순. */
  competitions: Competition[];
};

/**
 * 카드에 올릴 묶음 — 내가 관심 등록한 대회 중 카드 기간 안에 끝난 대회를 한 날·같은 주말로 묶어 최근 순으로.
 *
 * 같은 주말에 관심 대회가 여럿 끝나면 한 장으로 묶는다 — 카드가 여러 장 쌓이면 피곤하고 헷갈린다.
 * 화면은 이 중 닫지 않은 첫 묶음 한 장만 띄운다. 날짜 값이 잘못된 대회(모양이 틀리거나 13월처럼 없는 날)는 빼낸다
 * — 대회 하나의 틀린 값 때문에 대회 탭 전체가 실패 화면이 되지 않게.
 */
export function recentlyEndedInterested(
  competitions: readonly Competition[],
  interestedIds: ReadonlySet<number>,
  today: string,
): ResultCardGroup[] {
  const groups = new Map<string, ResultCardGroup>();
  const ended = competitions
    .filter(
      (competition) =>
        interestedIds.has(competition.id) &&
        isDateKey(competition.date) &&
        competition.date < today &&
        isOnCardDay(competition.date, today),
    )
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.name.localeCompare(b.name, "ko"),
    );

  for (const competition of ended) {
    const saturday = weekendSaturday(competition.date);
    const key = saturday ? `weekend:${saturday}` : competition.date;
    const daysAgo = daysBetween(competition.date, today);
    const group = groups.get(key);
    if (group) {
      group.competitions.push(competition);
      // 날짜순으로 넣으니 나중 대회가 더 최근이다.
      group.daysAgo = daysAgo;
    } else {
      groups.set(key, {
        key,
        weekend: saturday !== null,
        daysAgo,
        competitions: [competition],
      });
    }
  }

  return [...groups.values()].sort((a, b) => a.daysAgo - b.daysAgo);
}

/**
 * 오늘이 카드를 보여 주는 마지막 날 이전인지 — 마지막 날은 대회일 + 5일, 토요일 대회면 + 6일(그 주 금요일).
 * 일요일 대회는 + 5일이 금요일이다. 달력에 없는 날짜면 false.
 */
function isOnCardDay(date: string, today: string): boolean {
  if (!isRealDate(date)) return false;
  return (
    today <= addDays(date, RESULT_CARD_DAYS + (weekdayOf(date) === 6 ? 1 : 0))
  );
}

/** 모양만 맞고 달력에 없는 날(2026-13-01 · 2026-02-31)을 걸러 낸다 — 그대로 계산하면 날짜를 지어내거나 예외가 난다. */
function isRealDate(date: string): boolean {
  const parsed = new Date(`${date}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date
  );
}

/** 토·일이면 그 주말의 토요일 날짜, 평일이면 null. */
function weekendSaturday(date: string): string | null {
  const weekday = weekdayOf(date);
  if (weekday === 6) return date;
  if (weekday === 0) return addDays(date, -1);
  return null;
}

/** 0 = 일요일 … 6 = 토요일. 날짜만 있는 값이라 UTC 자정으로 놓고 읽는다. */
function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

function addDays(date: string, days: number): string {
  const moved = new Date(`${date}T00:00:00Z`);
  moved.setUTCDate(moved.getUTCDate() + days);
  return moved.toISOString().slice(0, 10);
}
