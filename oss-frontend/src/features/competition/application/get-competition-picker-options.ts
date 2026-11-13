import {
  createGetCompetitionDetailUseCase,
  createGetCompetitionPickerUseCase,
} from "@/features/competition/application/competition-use-case-factory";
import { isCompetitionEnabled } from "@/features/competition/application/is-competition-enabled";
import type { Competition } from "@/features/competition/domain/competition";
import { daysBetween } from "@/features/competition/domain/competition-registration";
import { readServerNow, toKstDateKey } from "@/shared/lib/time";

/** 글쓰기 대회 고르기의 한 줄(#367). */
export type CompetitionPickerOption = {
  id: number;
  name: string;
  /** 대회 날짜 "YYYY-MM-DD". 볼 수 없는 대회는 빈 문자열 */
  date: string;
  place: string;
  /** 글이 고른 대회가 미공개로 바뀌어 이름을 모를 때(#417) — 고르기 칸에 '볼 수 없는 대회'로 남겨 지울 수 있게 한다. */
  unavailable?: boolean;
};

/** 미공개로 바뀐 대회 자리의 이름 */
const UNAVAILABLE_COMPETITION_NAME = "볼 수 없는 대회";

/** 검색어 없이 펼친 목록에서는 끝난 대회를 이 날수까지만 둔다 — 대회 뒤 후기 글을 쓰는 기간. 더 지난 대회는 이름으로 찾는다. */
export const PICKABLE_ENDED_DAYS = 30;

/** 글이 이미 고른 대회 — 카드가 있으면 include, 미공개로 바뀌어 id만 있으면 includeId. */
export type SelectedCompetition = {
  include?: Competition | null;
  includeId?: number | null;
};

/**
 * 고르기 목록은 글쓰기 · 수정 화면을 열 때마다 백엔드를 기다리지 않게 서버 메모리에 잠시 기억해 둔다(#444).
 * 익명으로 읽어 모든 사람에게 같은 결과라 함께 써도 된다. 글 종류 목록(#389)과 같은 방식이다 — 기한이 지나면
 * 기억한 값을 바로 쓰며 뒤에서 새로 받고, 실패는 기억하지 않는다. 기한 동안 새로 등록 · 수정된 대회는
 * 고르기 목록에 늦게 보인다(이름으로 찾기는 늘 새로 읽는다).
 */
const PICKER_CACHE_MS = 5 * 60 * 1000;
/** 새로 받기에 실패하면 이만큼 뒤에 다시 시도한다 — 장애 동안 요청마다 백엔드를 두드리지 않게. */
const PICKER_RETRY_MS = 30 * 1000;
/**
 * 기억한 목록과 그 목록을 거른 날(응답 today, 백엔드 KST) — 이 서버의 KST 날짜와 다르면 끝난 대회 거르기가
 * 달라져 다시 받는다. 받은 시각이 아니라 응답 today로 기억해, 자정 직전에 시작한 응답이 "오늘 목록"으로
 * 남지 않게 한다.
 */
let cachedPicker: {
  options: CompetitionPickerOption[];
  today: string;
  at: number;
} | null = null;
/** 마지막으로 새로 받기에 실패한 시각 — 날짜가 바뀐 뒤 장애 중에도 요청마다 백엔드를 기다리지 않게. */
let lastFailureAt: number | null = null;
let inflight: Promise<CompetitionPickerOption[] | null> | null = null;

/**
 * 글쓰기에서 고를 수 있는 대회(#367 · #421) — 서버가 다가오는 대회 → 끝난 대회(최근 순), 최대 20개를 고른다.
 *
 * 글 수정은 글 조회와 같이 시작하려고 목록만 먼저 읽고(#441), 글을 받은 뒤 withSelectedCompetition으로
 * 이 글이 고른 대회를 합친다. 읽기에 실패하면 기억해 둔 목록(어제 것이라도), 그것도 없으면 빈 목록 —
 * 글쓰기를 막지 않는다. 실패를 삼켜 먼저 시작해 두어도 거부되지 않는다. 대회 화면이 꺼진 배포에서는 빈 목록이다 —
 * 고르기 칸이 나오지 않는다.
 */
export async function loadPickableCompetitionOptions(): Promise<
  CompetitionPickerOption[]
> {
  if (!isCompetitionEnabled()) return [];
  const now = readServerNow();
  // 날짜가 바뀌었으면 기억한 목록을 쓰지 않고 기다려 새로 받는다 — 끝난 지 30일 거르기가 하루 어긋나지 않게.
  if (cachedPicker && cachedPicker.today === toKstDateKey(now)) {
    if (now - cachedPicker.at > PICKER_CACHE_MS) void refreshPicker();
    return cachedPicker.options;
  }
  // 날짜가 바뀌었는데 방금 새로 받기에 실패했으면 다시 묻지 않고 어제 목록을 쓴다(대부분 그대로 유효).
  if (
    cachedPicker &&
    lastFailureAt !== null &&
    now - lastFailureAt < PICKER_RETRY_MS
  ) {
    return cachedPicker.options;
  }
  return (await refreshPicker()) ?? cachedPicker?.options ?? [];
}

/** 고르기 목록을 새로 받아 기억한다. 동시에 여러 요청이 와도 백엔드에는 한 번만 묻는다. 실패면 null. */
function refreshPicker(): Promise<CompetitionPickerOption[] | null> {
  // 저장소를 만들다 바로 던져도 실패 갈래로 가도록 약속 안에서 부른다.
  inflight ??= Promise.resolve()
    // 고르기 목록은 내 관심 등 로그인 값을 쓰지 않는다 — 익명으로 읽어 토큰이 만료돼도 목록이 빠지지 않게.
    .then(() => createGetCompetitionPickerUseCase(null).execute())
    .then((page) => {
      const options = page.competitions
        .filter(
          (competition) =>
            competition.date >= page.today ||
            daysBetween(competition.date, page.today) <= PICKABLE_ENDED_DAYS,
        )
        .map(toPickerOption);
      cachedPicker = { options, today: page.today, at: readServerNow() };
      lastFailureAt = null;
      return options;
    })
    .catch(() => {
      // 실패는 기억하지 않는다. 기억한 값이 있으면 그대로 쓰되 다시 시도는 잠시 뒤로 미룬다.
      lastFailureAt = readServerNow();
      if (cachedPicker) {
        cachedPicker = {
          ...cachedPicker,
          at: readServerNow() - PICKER_CACHE_MS + PICKER_RETRY_MS,
        };
      }
      return null;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/**
 * 글 수정 — 이 글이 이미 고른 대회(include)를 고르기 목록 맨 위에 둔다(목록에 있던 같은 대회는 뺀다).
 * 목록 밖이어도 보이고 지울 수 있게. 고른 대회가 미공개로 바뀌어 카드 없이 id만 있으면(includeId)
 * '볼 수 없는 대회' 자리를 맨 위에 둔다. 목록 읽기에 실패했어도 고른 대회 하나는 남긴다.
 * 대회 화면이 꺼진 배포에서는 빈 목록 — 고르기 칸이 나오지 않는다.
 */
export function withSelectedCompetition(
  options: CompetitionPickerOption[],
  { include = null, includeId = null }: SelectedCompetition,
): CompetitionPickerOption[] {
  if (!isCompetitionEnabled()) return [];
  const kept: CompetitionPickerOption | null = include
    ? toPickerOption(include)
    : includeId !== null
      ? {
          id: includeId,
          name: UNAVAILABLE_COMPETITION_NAME,
          date: "",
          place: "",
          unavailable: true,
        }
      : null;
  if (!kept) return options;
  return [kept, ...options.filter((option) => option.id !== kept.id)];
}

/**
 * 새 글쓰기의 대회 고르기(#433) — 대회 이야기의 "첫 글 남기기"로 들어오면 그 대회를 미리 골라 둔다.
 *
 * 미리 고를 대회가 고르기 목록에 없으면 상세로 읽어 맨 위에 넣는다(20개 밖·오래 지난 대회도 고를 수 있게).
 * 대회 화면이 꺼진 배포이거나, 없는·미공개 대회이거나, 읽기에 실패하면 미리 고르지 않는다(빈 글쓰기).
 */
export async function getCompetitionPickerForWrite(
  preselectId: number | null,
): Promise<{ options: CompetitionPickerOption[]; initialId: number | null }> {
  const options = await loadPickableCompetitionOptions();
  if (preselectId === null || !isCompetitionEnabled()) {
    return { options, initialId: null };
  }
  if (options.some((option) => option.id === preselectId)) {
    return { options, initialId: preselectId };
  }
  try {
    const detail =
      await createGetCompetitionDetailUseCase(null).execute(preselectId);
    if (!detail) return { options, initialId: null };
    return {
      options: [toPickerOption(detail.competition), ...options],
      initialId: preselectId,
    };
  } catch {
    return { options, initialId: null };
  }
}

/** 이름으로 찾기(#421) — 지난 대회도 찾는다. 서버 순서 그대로, 최대 20개. 실패면 null. */
export async function searchCompetitionPickerOptions(
  keyword: string,
): Promise<CompetitionPickerOption[] | null> {
  if (!isCompetitionEnabled()) return null;
  try {
    const page = await createGetCompetitionPickerUseCase(null).execute(keyword);
    return page.competitions.map(toPickerOption);
  } catch {
    return null;
  }
}

function toPickerOption(competition: Competition): CompetitionPickerOption {
  return {
    id: competition.id,
    name: competition.name,
    date: competition.date,
    place: competition.place,
  };
}
