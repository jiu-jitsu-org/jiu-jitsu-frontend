import {
  createGetCompetitionListUseCase,
  createGetPostCompetitionIdUseCase,
} from "@/features/competition/application/competition-use-case-factory";
import { isCompetitionPageEnabled } from "@/features/competition/application/is-competition-page-enabled";
import { daysBetween } from "@/features/competition/domain/competition-registration";
import { toKstDateKey } from "@/shared/lib/time";

/** 글쓰기 대회 고르기의 한 줄(#367). */
export type CompetitionPickerOption = {
  id: string;
  name: string;
  date: string;
  place: string;
};

/** 끝난 대회도 이 날수까지는 고를 수 있다 — 대회 뒤 후기 글을 쓰는 기간. */
export const PICKABLE_ENDED_DAYS = 30;

/**
 * 글쓰기에서 고를 수 있는 대회(#367) — 다가오는 대회를 가까운 순으로, 그 뒤에 최근 끝난 대회를 최근 순으로.
 *
 * 대회 데이터가 아직 가짜라 대회 탭을 여는 환경(로컬·개발 서버)에서만 내려 준다 — 운영에서는 빈 목록이고,
 * 글쓰기 화면은 대회 고르기 칸을 그리지 않는다. 읽기에 실패해도 빈 목록 — 글쓰기를 막지 않는다.
 */
export async function getCompetitionPickerOptions({
  now,
  include = null,
}: {
  now: number;
  /** 글 수정 — 이 글이 이미 고른 대회. 오래돼 목록에서 빠졌어도 맨 위에 넣어 보이고 지울 수 있게 한다. */
  include?: string | null;
}): Promise<CompetitionPickerOption[]> {
  if (!isCompetitionPageEnabled()) return [];
  try {
    const today = toKstDateKey(now);
    const competitions = await createGetCompetitionListUseCase().execute();
    const toOption = (competition: (typeof competitions)[number]) => ({
      id: competition.id,
      name: competition.name,
      date: competition.date,
      place: competition.place,
    });
    const upcoming = competitions
      .filter((competition) => competition.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name, "ko"));
    const recentlyEnded = competitions
      .filter(
        (competition) =>
          competition.date < today &&
          daysBetween(competition.date, today) <= PICKABLE_ENDED_DAYS,
      )
      .sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name, "ko"));
    const options = [...upcoming, ...recentlyEnded];
    const kept = include
      ? competitions.find(
          (competition) =>
            competition.id === include &&
            !options.some((option) => option.id === include),
        )
      : undefined;
    return [...(kept ? [kept] : []), ...options].map(toOption);
  } catch {
    return [];
  }
}

/** 글 수정 화면의 처음 값 — 이 글이 고른 대회 id. 없거나 읽기 실패면 null. */
export async function getPostCompetitionId(postId: number): Promise<string | null> {
  if (!isCompetitionPageEnabled()) return null;
  try {
    return await createGetPostCompetitionIdUseCase().execute(postId);
  } catch {
    return null;
  }
}
