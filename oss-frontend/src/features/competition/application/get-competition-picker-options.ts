import { createGetCompetitionPickerUseCase } from "@/features/competition/application/competition-use-case-factory";
import { isCompetitionEnabled } from "@/features/competition/application/is-competition-enabled";
import type { Competition } from "@/features/competition/domain/competition";
import { daysBetween } from "@/features/competition/domain/competition-registration";
import { readSessionToken } from "@/shared/lib/auth";

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
    const accessToken = await readSessionToken();
    const page = await createGetCompetitionPickerUseCase(accessToken).execute();
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

/** 이름으로 찾기(#421) — 지난 대회도 찾는다. 서버 순서 그대로, 최대 20개. 실패면 null. */
export async function searchCompetitionPickerOptions(
  keyword: string,
): Promise<CompetitionPickerOption[] | null> {
  if (!isCompetitionEnabled()) return null;
  try {
    const accessToken = await readSessionToken();
    const page =
      await createGetCompetitionPickerUseCase(accessToken).execute(keyword);
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
