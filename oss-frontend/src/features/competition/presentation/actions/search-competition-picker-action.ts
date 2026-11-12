"use server";

import {
  searchCompetitionPickerOptions,
  type CompetitionPickerOption,
} from "@/features/competition/application/get-competition-picker-options";

/** 검색어 상한 — 대회 이름(100자)보다 넉넉하게. */
const MAX_KEYWORD_LENGTH = 100;

/**
 * 글쓰기 대회 고르기의 이름 검색 Server Action(#421) — 펼친 목록에 없는 지난 대회도 이름으로 찾는다.
 * 실패면 null — 화면은 펼친 목록 안에서만 거른다.
 */
export async function searchCompetitionPickerAction(
  keyword: string,
): Promise<CompetitionPickerOption[] | null> {
  if (typeof keyword !== "string") return null;
  const trimmed = keyword.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_KEYWORD_LENGTH) return null;
  return searchCompetitionPickerOptions(trimmed);
}
