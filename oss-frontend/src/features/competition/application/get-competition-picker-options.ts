import {
  createGetCompetitionDetailUseCase,
  createGetCompetitionPickerUseCase,
} from "@/features/competition/application/competition-use-case-factory";
import { isCompetitionEnabled } from "@/features/competition/application/is-competition-enabled";
import type { Competition } from "@/features/competition/domain/competition";
import { daysBetween } from "@/features/competition/domain/competition-registration";

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

/**
 * 글쓰기에서 고를 수 있는 대회(#367 · #421) — 서버가 다가오는 대회 → 끝난 대회(최근 순), 최대 20개를 고른다.
 *
 * 글 수정이면 이 글이 이미 고른 대회(include)를 맨 위에 둔다 — 목록 밖이어도 보이고 지울 수 있게.
 * 고른 대회가 미공개로 바뀌어 카드 없이 id만 있으면(includeId) '볼 수 없는 대회' 자리를 맨 위에 둔다.
 * 읽기에 실패해도 빈 목록 — 글쓰기를 막지 않는다(고른 대회가 있으면 그 하나는 남긴다).
 * 대회 화면이 꺼진 배포에서는 빈 목록이다 — 고르기 칸이 나오지 않는다.
 */
export async function getCompetitionPickerOptions({
  include = null,
  includeId = null,
}: {
  include?: Competition | null;
  includeId?: number | null;
} = {}): Promise<CompetitionPickerOption[]> {
  if (!isCompetitionEnabled()) return [];
  let options: CompetitionPickerOption[] = [];
  try {
    // 고르기 목록은 내 관심 등 로그인 값을 쓰지 않는다 — 익명으로 읽어 토큰이 만료돼도 목록이 빠지지 않게.
    const page = await createGetCompetitionPickerUseCase(null).execute();
    options = page.competitions
      .filter(
        (competition) =>
          competition.date >= page.today ||
          daysBetween(competition.date, page.today) <= PICKABLE_ENDED_DAYS,
      )
      .map(toPickerOption);
  } catch {
    options = [];
  }
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
  const options = await getCompetitionPickerOptions();
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
