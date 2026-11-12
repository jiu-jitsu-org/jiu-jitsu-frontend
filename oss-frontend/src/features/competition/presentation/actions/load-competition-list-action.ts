"use server";

import { isCompetitionEnabled } from "@/features/competition/application/is-competition-enabled";
import {
  loadCompetitionListChunk,
  type CompetitionListChunk,
} from "@/features/competition/application/get-competition-list-page-data";
import { COMPETITION_REGIONS } from "@/features/competition/domain/competition-region";
import {
  COMPETITION_FULL_PAGE_SIZE,
  type CompetitionListQuery,
  type CompetitionStatus,
} from "@/features/competition/domain/competition";
import { isDateKey } from "@/features/competition/domain/competition-registration";

const STATUSES: readonly CompetitionStatus[] = [
  "upcoming",
  "open",
  "closed",
  "ended",
];
const MAX_TEXT_LENGTH = 200;

export type LoadCompetitionListResult =
  | { ok: true; chunk: CompetitionListChunk }
  | { ok: false; reason: "unauthenticated" | "failed" };

/**
 * 대회 목록 이어 받기 Server Action (#419) — 필터를 바꾼 첫 페이지 · 아래로 내린 다음 페이지 · 달력 한 달.
 * 화면 밖에서도 부를 수 있는 입구라 조건 모양을 다시 보고, 모르는 값은 버린다.
 */
export async function loadCompetitionListAction(
  query: CompetitionListQuery,
): Promise<LoadCompetitionListResult> {
  if (!isCompetitionEnabled() || typeof query !== "object" || query === null) {
    return { ok: false, reason: "failed" };
  }
  const size = Number(query.size);
  const clean: CompetitionListQuery = {
    ...(typeof query.cursor === "string" &&
    query.cursor.length > 0 &&
    query.cursor.length <= MAX_TEXT_LENGTH
      ? { cursor: query.cursor }
      : typeof query.date === "string" && isDateKey(query.date)
        ? { date: query.date }
        : {}),
    size:
      Number.isInteger(size) && size >= 1 && size <= COMPETITION_FULL_PAGE_SIZE
        ? size
        : COMPETITION_FULL_PAGE_SIZE,
    regions: Array.isArray(query.regions)
      ? COMPETITION_REGIONS.filter((region) => query.regions?.includes(region))
      : [],
    statuses: Array.isArray(query.statuses)
      ? STATUSES.filter((status) => query.statuses?.includes(status))
      : [],
    interested: query.interested === true,
    ...(typeof query.keyword === "string" &&
    query.keyword.trim().length > 0 &&
    query.keyword.length <= MAX_TEXT_LENGTH
      ? { keyword: query.keyword.trim() }
      : {}),
  };
  return loadCompetitionListChunk(clean);
}
