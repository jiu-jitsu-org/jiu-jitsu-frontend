import type { Competition } from "@/features/competition/domain/competition";
import { detailStatusOn } from "@/features/competition/domain/competition-schedule";

/**
 * 대회 상태 링크 (#469 · #470).
 *
 * 대회 공지(요강) 대신 지금 필요한 접수 사이트 페이지 — 신청 · 참가자 현황 · 대진표/시간표 · 실시간 매트 · 결과.
 * 보이는 기간 · 운영자 확인 · 숨김은 서버가 거른다고 보고, 웹은 받은 링크 중 지금 단계에 맞는 것만 고른다.
 */

export type CompetitionEntryLinkKind =
  | "register"
  | "participants"
  | "bracket"
  | "liveMat"
  | "result";

export type CompetitionEntryLink = {
  kind: CompetitionEntryLinkKind;
  /** http(s) 주소만 온다 — 다른 형식은 받을 때 버린다. */
  url: string;
  /** 접수 사이트 이름. 예: "FLOWCOMP" */
  siteName?: string;
};

/** 한 번에 보여 주는 상태 링크 수 — 당일처럼 여럿이어도 두 개까지. */
export const MAX_ENTRY_LINKS = 2;

/**
 * 지금 보여 줄 상태 링크 — 단계마다 정해진 종류만, 정해진 순서로, 두 개까지.
 *
 * - 접수 중 → 신청
 * - 접수 마감 뒤 대회 전 → 참가자 현황 · 대진표/시간표
 * - 대회 당일 → 실시간 매트 · 대진표/시간표
 * - 대회 다음 날부터 → 결과
 *
 * 당일 · 종료는 상세 상태와 같은 날짜 계산(detailStatusOn)으로, 그 전은 서버가 정한 접수 상태로 나눈다.
 */
export function entryLinksOn(
  competition: Competition,
  today: string,
): CompetitionEntryLink[] {
  const links = competition.entryLinks ?? [];
  if (links.length === 0) return [];
  return stageKinds(competition, today)
    .flatMap((kind) => {
      const link = links.find((candidate) => candidate.kind === kind);
      return link ? [link] : [];
    })
    .slice(0, MAX_ENTRY_LINKS);
}

function stageKinds(
  competition: Competition,
  today: string,
): CompetitionEntryLinkKind[] {
  const status = detailStatusOn(competition, today);
  if (!status) return [];
  if (status.kind === "ended") return ["result"];
  if (status.kind === "today") return ["liveMat", "bracket"];
  switch (competition.status) {
    case "open":
      return ["register"];
    case "closed":
      return ["participants", "bracket"];
    default:
      return [];
  }
}

/** 링크로 열어도 되는 주소인지 — http(s)만. 다른 형식의 값이 눌리는 링크가 되지 않게. */
export function isWebUrl(value: string | undefined): value is string {
  return !!value && /^https?:\/\//i.test(value);
}
