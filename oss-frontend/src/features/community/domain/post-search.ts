import {
  FEED_PAGE_SIZE,
  type BoardListQuery,
} from "@/features/community/domain/post-summary";

/**
 * 커뮤니티 글 검색 규칙(#591).
 *
 * 서버(GET /board?boardListType=SEARCH, jiu-jitsu-backend#265)는 검색어를 띄어쓰기로 나눠 모든 단어가
 * 제목 · 본문 · 태그 어딘가에 든 글을 최신순으로 준다. 글 쪽 띄어쓰기와 영문 대소문자는 무시한다
 * ('오픈매트' = '오픈 매트', 'nogi' = 'NoGi'). 같은 단어는 하나로, 단어는 10개까지 본다.
 * 화면의 '찾은 말 표시'도 같은 규칙으로 찾아야 결과 카드에서 왜 나왔는지 보인다.
 */

/** 서버가 보는 단어 수 상한 — 넘는 단어는 서버도 버린다. */
export const SEARCH_WORD_LIMIT = 10;

/** 이 기기에 남기는 최근 검색 수. */
export const RECENT_SEARCH_LIMIT = 10;

/** 검색어를 다듬는다 — 앞뒤 공백을 빼고 사이 공백은 하나로. 비면 "" (요청하지 않는다). */
export function normalizeSearchKeyword(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

/** 검색어를 단어로 나눈다 — 소문자, 같은 단어는 하나로, 10개까지(서버와 같은 규칙). */
export function splitSearchWords(keyword: string): string[] {
  const words = normalizeSearchKeyword(keyword)
    .split(" ")
    .filter(Boolean)
    .map((word) => word.toLowerCase());
  return [...new Set(words)].slice(0, SEARCH_WORD_LIMIT);
}

/** 검색 첫 페이지 조회 조건. */
export function toSearchListQuery(keyword: string, page = 0): BoardListQuery {
  return {
    boardListType: "SEARCH",
    searchKeyword: keyword,
    page,
    size: FEED_PAGE_SIZE,
  };
}

/** 글 속 찾은 말의 자리 — 원문 기준 [start, end). */
export type SearchMatch = { start: number; end: number };

/**
 * 글에서 검색 단어가 든 자리를 찾는다 — 띄어쓰기 · 영문 대소문자를 무시한다.
 *
 * 공백을 뺀 소문자 글에서 찾고, 찾은 범위를 원문 위치로 되돌린다. 그래서 '오픈매트'로 찾으면 원문의
 * '오픈 매트'가 사이 공백까지 한 덩어리로 표시된다. 겹치거나 붙은 자리는 하나로 합친다.
 */
export function findSearchMatches(
  text: string,
  words: readonly string[],
): SearchMatch[] {
  if (!text || words.length === 0) return [];

  // 공백을 뺀 소문자 글과, 그 글자(코드 유닛)마다 원문 위치.
  let compact = "";
  const origin: number[] = [];
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (/\s/.test(char)) continue;
    const lower = char.toLowerCase();
    compact += lower;
    for (let unit = 0; unit < lower.length; unit += 1) origin.push(index);
  }

  const found: SearchMatch[] = [];
  for (const word of words) {
    const needle = word.replace(/\s+/g, "").toLowerCase();
    if (!needle) continue;
    let from = compact.indexOf(needle);
    while (from >= 0) {
      found.push({
        start: origin[from],
        end: origin[from + needle.length - 1] + 1,
      });
      from = compact.indexOf(needle, from + needle.length);
    }
  }
  if (found.length === 0) return [];

  found.sort((a, b) => a.start - b.start);
  const merged: SearchMatch[] = [found[0]];
  for (const match of found.slice(1)) {
    const last = merged[merged.length - 1];
    if (match.start <= last.end) last.end = Math.max(last.end, match.end);
    else merged.push({ ...match });
  }
  return merged;
}

/** 분석 기록(GA `search`)의 결과 수 구간 — 검색어는 보내지 않고 구간만 보낸다. */
export type SearchResultBucket = "0" | "1-5" | "6+";

export function searchResultBucket(total: number): SearchResultBucket {
  if (total <= 0) return "0";
  return total <= 5 ? "1-5" : "6+";
}

/** 최근 검색에 더한다 — 맨 앞에, 같은 말은 앞으로 옮기고, 10개까지. */
export function addRecentSearch(
  recent: readonly string[],
  keyword: string,
): string[] {
  return [keyword, ...recent.filter((item) => item !== keyword)].slice(
    0,
    RECENT_SEARCH_LIMIT,
  );
}
