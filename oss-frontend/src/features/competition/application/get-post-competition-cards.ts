import {
  createGetCompetitionInterestCountsUseCase,
  createGetCompetitionListUseCase,
  createGetInterestedCompetitionIdsUseCase,
  createGetPostCompetitionIdsUseCase,
} from "@/features/competition/application/competition-use-case-factory";
import { isCompetitionPageEnabled } from "@/features/competition/application/is-competition-page-enabled";
import { loadCompetitionAlertSettings } from "@/features/competition/application/load-competition-alert-settings";
import type { CompetitionAlertSettings } from "@/features/competition/domain/competition-alert";
import type { CompetitionCard } from "@/features/competition/domain/competition-card";
import { registrationStatusOn } from "@/features/competition/domain/competition-registration";
import { toKstDateKey } from "@/shared/lib/time";

/**
 * 글들이 고른 대회 카드(#379 · #380) — 글 id → 카드. 대회를 고르지 않은 글은 빠진다.
 *
 * 글 목록·상세 응답에 고른 대회가 실려 오기 전까지 대회 feature가 따로 읽어 붙인다(API 없음, 가짜 저장소).
 * 대회 화면이 닫혀 있는 곳(운영)에서는 카드를 만들지 않는다 — 눌러도 열 대회 상세가 없다.
 * 카드는 덧붙는 정보라 못 읽으면 빈 결과로 둔다 — 글 목록·상세를 막지 않는다.
 */
export async function getPostCompetitionCards({
  postIds,
  now,
  signedIn,
}: {
  postIds: readonly number[];
  now: number;
  signedIn: boolean;
}): Promise<Record<number, CompetitionCard>> {
  if (postIds.length === 0 || !isCompetitionPageEnabled()) return {};
  try {
    const links = await createGetPostCompetitionIdsUseCase().execute(postIds);
    if (Object.keys(links).length === 0) return {};

    const [competitions, interestedIds, interestCounts] = await Promise.all([
      createGetCompetitionListUseCase().execute(),
      signedIn
        ? createGetInterestedCompetitionIdsUseCase()
            .execute()
            .catch(() => [] as string[])
        : Promise.resolve([] as string[]),
      createGetCompetitionInterestCountsUseCase()
        .execute()
        .catch(() => ({}) as Record<string, number>),
    ]);
    const byId = new Map(
      competitions.map((competition) => [competition.id, competition]),
    );
    const interested = new Set(interestedIds);
    const today = toKstDateKey(now);
    const currentYear = Number(today.slice(0, 4));

    const cards: Record<number, CompetitionCard> = {};
    for (const [postId, competitionId] of Object.entries(links)) {
      const competition = byId.get(competitionId);
      if (!competition) continue;
      cards[Number(postId)] = {
        competition,
        registration: competition.registration
          ? registrationStatusOn(competition.registration, today)
          : null,
        ended: competition.date < today,
        interested: interested.has(competition.id),
        interestCount: interestCounts[competition.id] ?? 0,
        currentYear,
      };
    }
    return cards;
  } catch {
    return {};
  }
}

export type PostCompetition = {
  card: CompetitionCard;
  /** 관심 대회 알림 설정 — 카드 하트로 처음 관심 등록하면 시트를 띄운다(#375). 비로그인·못 읽으면 null */
  alertSettings: CompetitionAlertSettings | null;
  /** 한국 날짜 "YYYY-MM-DD" */
  today: string;
};

/** 글 상세의 대회 카드(#380). 대회를 고르지 않은 글이면 null. */
export async function getPostCompetition({
  postId,
  now,
  signedIn,
}: {
  postId: number;
  now: number;
  signedIn: boolean;
}): Promise<PostCompetition | null> {
  const cards = await getPostCompetitionCards({
    postIds: [postId],
    now,
    signedIn,
  });
  const card = cards[postId];
  if (!card) return null;
  return {
    card,
    alertSettings: signedIn ? await loadCompetitionAlertSettings() : null,
    today: toKstDateKey(now),
  };
}
