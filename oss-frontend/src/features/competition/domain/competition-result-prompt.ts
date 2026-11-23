import type { Competition } from "@/features/competition/domain/competition";
import {
  daysBetween,
  isDateKey,
} from "@/features/competition/domain/competition-registration";
import { lastDayOf } from "@/features/competition/domain/competition-schedule";

/**
 * 대회 탭 맨 위 결과 남기기 카드 규칙 (#403).
 *
 * 관심 등록한 대회가 끝나면 대회 탭 맨 위(곧 마감 배너 자리)에서 결과를 남길지 묻는다.
 * 대회 상세의 결과 남기기 배너(#368)와 같은 일을, 사람들이 자주 여는 대회 탭에서 끝난 직후 며칠만 한다.
 * 날짜는 모두 한국 날짜 "YYYY-MM-DD", "오늘"은 호출부가 서버 시각으로 정해 넘긴다.
 * '끝난 날'은 마지막 날이다 — 여러 날 대회는 종료일(backend#227), 하루짜리는 대회일.
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
        lastDayOf(competition) < today &&
        isOnCardDay(lastDayOf(competition), today),
    )
    .sort(
      (a, b) =>
        lastDayOf(a).localeCompare(lastDayOf(b)) ||
        a.name.localeCompare(b.name, "ko"),
    );

  for (const competition of ended) {
    const lastDay = lastDayOf(competition);
    const saturday = weekendSaturday(lastDay);
    const key = saturday ? `weekend:${saturday}` : lastDay;
    const daysAgo = daysBetween(lastDay, today);
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
 * 이미 내 대회 기록에 남긴 대회를 묶음에서 뺀다(#545) — 남긴 대회에 결과를 또 물으면 같은 기록이 하나 더 생기기 쉽다.
 * 다 빠진 묶음은 버린다. 기록을 못 읽었으면(null) 그대로 둔다.
 */
export function withoutRecorded(
  groups: readonly ResultCardGroup[],
  recordedIds: ReadonlySet<number> | null,
): ResultCardGroup[] {
  if (!recordedIds || recordedIds.size === 0) return [...groups];
  return groups
    .map((group) => ({
      ...group,
      competitions: group.competitions.filter(({ id }) => !recordedIds.has(id)),
    }))
    .filter((group) => group.competitions.length > 0);
}

/**
 * 오늘이 카드를 보여 주는 마지막 날 이전인지 — 마지막 날은 끝난 날 + 5일, 토요일에 끝났으면 + 6일(그 주 금요일).
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

/**
 * 결과 남기기 안내를 ✕로 닫은 기록 — 대회 하나에 하나, 대회 탭 카드와 상세 배너가 함께 쓴다.
 *
 * 처음 닫으면 그날만 쉰다 — 다음 날 카드 기간 안이면 한 번 더 묻는다. 다시 떴을 때 또 닫으면 그 대회는 더 묻지 않는다.
 * 하루 뒤 한 번 더 묻는 이유: 대회 다음 날은 지쳐서 닫기 쉬운데, 그대로 끝나면 기록을 남길 때를 놓친다.
 */
export type ResultPromptCloseRecord = {
  /** 닫은 횟수 — 1이면 닫은 날만 숨기고, 2면 그 대회는 다시 묻지 않는다. */
  count: 1 | 2;
  /** 마지막으로 닫은 한국 날짜 "YYYY-MM-DD". */
  date: string;
};

/** 이 횟수만큼 닫으면 그 대회는 더 묻지 않는다. */
export const RESULT_PROMPT_CLOSE_LIMIT = 2;

/** 오늘 이 대회의 결과 남기기 안내를 숨길지 — 두 번 닫았거나, 오늘(이후) 닫았으면 숨긴다. */
export function isResultPromptClosedOn(
  record: ResultPromptCloseRecord | null,
  today: string,
): boolean {
  if (!record) return false;
  return record.count >= RESULT_PROMPT_CLOSE_LIMIT || record.date >= today;
}

/**
 * 오늘 ✕를 누른 뒤의 기록. 같은 날 또 닫으면(다른 화면에 남아 있던 안내 등) 횟수를 늘리지 않는다
 * — '두 번째'는 다음 날 다시 떴을 때 누른 ✕다.
 */
export function closeResultPromptOn(
  record: ResultPromptCloseRecord | null,
  today: string,
): ResultPromptCloseRecord {
  if (!record) return { count: 1, date: today };
  if (record.count >= RESULT_PROMPT_CLOSE_LIMIT || record.date >= today) {
    return record;
  }
  return { count: 2, date: today };
}

/**
 * 저장된 값 → 닫은 기록. 없거나 알아볼 수 없으면 null(닫지 않은 것으로 본다).
 * 전에 쓰던 "1"(한 번 닫으면 영영 숨김)은 날짜가 없어, 이 규칙으로 처음 읽는 오늘 처음 닫은 것으로 본다
 * — 닫은 바로 그날 다시 뜨는 일 없이, 다음 날 카드 기간 안이면 한 번 더 묻는다.
 */
export function parseResultPromptClose(
  raw: string | null,
  today: string,
): ResultPromptCloseRecord | null {
  if (raw === null) return null;
  if (raw === LEGACY_CLOSED) return { count: 1, date: today };
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return null;
    const { count, date } = value as { count?: unknown; date?: unknown };
    if (typeof count !== "number" || !Number.isInteger(count) || count < 1) {
      return null;
    }
    if (typeof date !== "string" || !isDateKey(date)) return null;
    return { count: count >= RESULT_PROMPT_CLOSE_LIMIT ? 2 : 1, date };
  } catch {
    return null;
  }
}

/** 전에 쓰던 저장 값인지 — 읽은 김에 날짜를 붙여 다시 써 둔다. */
export function isLegacyResultPromptClose(raw: string | null): boolean {
  return raw === LEGACY_CLOSED;
}

export function serializeResultPromptClose(
  record: ResultPromptCloseRecord,
): string {
  return JSON.stringify({ count: record.count, date: record.date });
}

/** #368 ~ #670 때 쓰던 값 — 한 번 닫으면 그 대회는 다시 뜨지 않았다. */
const LEGACY_CLOSED = "1";
