import type { Competition } from "@/features/competition/domain/competition";
import {
  detailStatusOn,
  type CompetitionDetailStatus,
} from "@/features/competition/domain/competition-schedule";

/**
 * 대회 상태 링크 (#469 · #470).
 *
 * 대회 공지(요강) 대신 지금 필요한 접수 사이트 페이지 — 신청 · 참가자 현황 · 대진표/시간표 · 실시간 매트 · 결과.
 * 보이는 기간 · 운영자 확인 · 숨김은 서버가 거른다고 보고, 웹은 받은 링크 중 지금 단계에 맞는 것만 고른다.
 */

export type CompetitionEntryLinkKind =
  "register" | "participants" | "bracket" | "liveMat" | "result";

export type CompetitionEntryLink = {
  kind: CompetitionEntryLinkKind;
  /** http(s) 주소만 온다 — 다른 형식은 받을 때 버린다. */
  url: string;
  /** 접수 사이트 이름. 예: "FLOWCOMP" */
  siteName?: string;
};

/** 접수 사이트 종류 — 대한체육회(kjf)는 도장(감독 · 코치)만 신청할 수 있다. */
export type CompetitionEntrySiteKind =
  "flowcomp" | "street" | "judaepl" | "kjf" | "other";

export type CompetitionEntrySite = {
  kind: CompetitionEntrySiteKind;
};

const ENTRY_SITES: Partial<
  Record<CompetitionEntrySiteKind, { name: string; host?: string }>
> = {
  flowcomp: { name: "FLOWCOMP", host: "flowcomp.co.kr" },
  street: { name: "스트릿 주짓수", host: "street-jiujitsu.com" },
  judaepl: { name: "주대플" },
  kjf: { name: "대한체육회", host: "sports.or.kr" },
};

/**
 * 버튼 위 "○○에서 신청 · 결제 / 보기"에 쓰는 사이트 이름 — 기타 사이트는 이름을 모른다.
 *
 * 서버의 접수 사이트(registrationSite)는 신청하는 곳이라 신청 링크에는 늘 붙인다. 대진표 · 실시간 매트 · 결과는
 * 다른 곳(예: 유튜브)일 수 있어 주소가 그 사이트일 때만 붙인다 — 엉뚱한 이름을 말하지 않게.
 */
export function entrySiteName(
  site: CompetitionEntrySiteKind,
  linkKind: CompetitionEntryLinkKind,
  url: string,
): string | undefined {
  const entry = ENTRY_SITES[site];
  if (!entry) return undefined;
  if (linkKind === "register") return entry.name;
  return entry.host && isOnHost(url, entry.host) ? entry.name : undefined;
}

function isOnHost(url: string, host: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === host || hostname.endsWith(`.${host}`);
  } catch {
    return false;
  }
}

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
 * 단계는 상세 맨 위 상태 칩과 같은 계산(detailStatusOn)으로 나눈다 — 칩이 '접수 중'일 때만 신청을 보여 주고,
 * 서버 상태가 접수 중이어도 마감일이 지났거나 공지되지 않아 칩이 접수 중이 아니면 신청을 띄우지 않는다.
 * 도장을 통해 신청하는 대회는 신청 링크가 와도 보여 주지 않는다(서버도 내려 주지 않는다).
 */
export function entryLinksOn(
  competition: Competition,
  today: string,
): CompetitionEntryLink[] {
  const links = competition.entryLinks ?? [];
  if (links.length === 0) return [];
  const kinds = stageKinds(competition, today).filter(
    (kind) => kind !== "register" || !competition.clubEntryOnly,
  );
  return kinds
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
  switch (detailStatusOn(competition, today)?.kind) {
    case "open":
      return ["register"];
    case "closed":
      return ["participants", "bracket"];
    case "today":
      return ["liveMat", "bracket"];
    case "ended":
      return ["result"];
    default:
      // 접수 예정 · 접수 일정 미정 · 날짜 모양이 틀린 대회
      return [];
  }
}

/** 도장(감독 · 코치)을 통해 신청하는 대회인지(서버가 정함) — 아직 접수 전 · 접수 중일 때만 알린다. */
export function isClubEntryOnly(
  competition: Pick<Competition, "clubEntryOnly" | "status">,
): boolean {
  return (
    competition.clubEntryOnly === true &&
    (competition.status === "upcoming" || competition.status === "open")
  );
}

/**
 * 참가비 아래 "신청과 결제는 대회 공지에서 해요"를 붙일지 — 공지 주소가 있고, 상태 칩이 접수 예정 · 접수 중이고,
 * 도장을 통해 신청하는 대회가 아니고, 아래 바에 신청하기가 없을 때(바가 신청 자리를 맡는다).
 * 마감 · 당일 · 종료면 신청할 일이 없어 붙이지 않는다.
 */
export function pointsToNoticeForEntry(
  competition: Pick<Competition, "noticeUrl" | "clubEntryOnly">,
  status: CompetitionDetailStatus | null,
  shownLinks: readonly CompetitionEntryLink[],
): boolean {
  return (
    isWebUrl(competition.noticeUrl) &&
    !competition.clubEntryOnly &&
    (status?.kind === "upcoming" || status?.kind === "open") &&
    !shownLinks.some((link) => link.kind === "register")
  );
}

/** 링크로 열어도 되는 주소인지 — http(s)만. 다른 형식의 값이 눌리는 링크가 되지 않게. */
export function isWebUrl(value: string | undefined): value is string {
  return !!value && /^https?:\/\//i.test(value);
}
