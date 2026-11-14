import type {
  Competition,
  CompetitionDivision,
  CompetitionFee,
  CompetitionStatus,
} from "@/features/competition/domain/competition";
import {
  isWebUrl,
  type CompetitionEntryLink,
  type CompetitionEntryLinkKind,
  type CompetitionEntrySite,
  type CompetitionEntrySiteKind,
} from "@/features/competition/domain/competition-entry-link";
import type { CompetitionRegion } from "@/features/competition/domain/competition-region";
import type { CompetitionRegistration } from "@/features/competition/domain/competition-registration";

/**
 * 대회 API 공통 응답 모양(backend#193)과 도메인 매핑 — 대회 목록·상세·고르기와 게시글 응답의 대회 카드가 같이 쓴다.
 *
 * 날짜는 타임존 없는 "yyyy-MM-dd"라 그대로 한국 날짜로 둔다. enum은 여기서만 안다.
 */

/** 없거나 미공개 대회(404) */
export const COMPETITION_NOT_FOUND_CODE = "C0010";

/** 서버 공통 봉투 { success, code, message, data } */
export type Envelope<T> = {
  success: boolean;
  code: string;
  message: string;
  data: T;
};

/** CompetitionListItem — 목록·고르기·게시글 카드 */
export type CompetitionListItemDto = {
  competitionId: number;
  name: string;
  openDate: string;
  region: string | null;
  place: string | null;
  uniforms: string[] | null;
  audience: string | null;
  status: string;
  earlyBirdOpen: boolean | null;
  registrationStartDate: string | null;
  earlyBirdDeadline: string | null;
  registrationDeadline: string | null;
  viewCount: number | null;
  interestCount: number | null;
  interested: boolean | null;
};

type CompetitionFeeDto = {
  label: string;
  amount: number;
  until: string | null;
};

/** CompetitionDetailResponse */
export type CompetitionDetailDto = CompetitionListItemDto & {
  today: string;
  startTime: string | null;
  venue: string | null;
  host: string | null;
  noticeUrl: string | null;
  fees: CompetitionFeeDto[] | null;
  feeNote: string | null;
  lastVerifiedDate: string | null;
  noticeEnabled: boolean | null;
  // 상태 링크 · 접수 사이트(#469 · #470) — 백엔드 계약 전 임시 이름. 아직 오지 않아 선택 필드로 둔다.
  entryLinks?: CompetitionEntryLinkDto[] | null;
  entrySite?: { type: string; name: string | null } | null;
};

type CompetitionEntryLinkDto = {
  type: string;
  url: string;
  siteName: string | null;
};

/** CompetitionListResponse */
export type CompetitionListDto = {
  today: string;
  competitions: CompetitionListItemDto[] | null;
  previousCursor: string | null;
  nextCursor: string | null;
};

/** 시·도 enum ↔ 화면 이름. 순서는 행정구역 표준 순서(COMPETITION_REGIONS와 같다). */
const REGION_CODES: Record<CompetitionRegion, string> = {
  서울: "SEOUL",
  부산: "BUSAN",
  대구: "DAEGU",
  인천: "INCHEON",
  광주: "GWANGJU",
  대전: "DAEJEON",
  울산: "ULSAN",
  세종: "SEJONG",
  경기: "GYEONGGI",
  강원: "GANGWON",
  충북: "CHUNGBUK",
  충남: "CHUNGNAM",
  전북: "JEONBUK",
  전남: "JEONNAM",
  경북: "GYEONGBUK",
  경남: "GYEONGNAM",
  제주: "JEJU",
};

const REGION_BY_CODE = new Map(
  Object.entries(REGION_CODES).map(([region, code]) => [
    code,
    region as CompetitionRegion,
  ]),
);

const STATUS_CODES: Record<CompetitionStatus, string> = {
  upcoming: "UPCOMING",
  open: "OPEN",
  closed: "CLOSED",
  ended: "ENDED",
};

const STATUS_BY_CODE = new Map(
  Object.entries(STATUS_CODES).map(([status, code]) => [
    code,
    status as CompetitionStatus,
  ]),
);

const DIVISION_BY_UNIFORM: Record<string, CompetitionDivision> = {
  GI: "gi",
  NO_GI: "nogi",
};

const ENTRY_LINK_KIND_BY_CODE: Record<string, CompetitionEntryLinkKind> = {
  REGISTER: "register",
  PARTICIPANTS: "participants",
  BRACKET: "bracket",
  LIVE_MAT: "liveMat",
  RESULT: "result",
};

const ENTRY_SITE_KIND_BY_CODE: Record<string, CompetitionEntrySiteKind> = {
  FLOWCOMP: "flowcomp",
  STREET: "street",
  JUDAEPL: "judaepl",
  KJF: "kjf",
};

/** 참가 대상 제한 — 제한 없음(null)은 표시하지 않는다. */
const AUDIENCE_LABELS: Record<string, string> = {
  ADULT: "성인",
  KIDS: "키즈",
};

export function toRegionCode(region: CompetitionRegion): string {
  return REGION_CODES[region];
}

export function toStatusCode(status: CompetitionStatus): string {
  return STATUS_CODES[status];
}

export function toCompetition(dto: CompetitionListItemDto): Competition {
  const registration: CompetitionRegistration = {
    ...(dto.registrationStartDate ? { opensOn: dto.registrationStartDate } : {}),
    ...(dto.registrationDeadline ? { closesOn: dto.registrationDeadline } : {}),
    ...(dto.earlyBirdDeadline
      ? { earlyBirdClosesOn: dto.earlyBirdDeadline }
      : {}),
  };
  const region = dto.region ? REGION_BY_CODE.get(dto.region) : undefined;
  const audience = dto.audience ? AUDIENCE_LABELS[dto.audience] : undefined;
  return {
    id: dto.competitionId,
    name: dto.name,
    date: dto.openDate,
    place: dto.place ?? "",
    ...(region ? { region } : {}),
    divisions: (dto.uniforms ?? []).flatMap((uniform) => {
      const division = DIVISION_BY_UNIFORM[uniform];
      return division ? [division] : [];
    }),
    ...(audience ? { audience } : {}),
    // 모르는 상태 값은 날짜로 다시 정하지 않고 접수 중으로 둔다 — 서버도 일정이 비면 접수 중으로 본다.
    status: STATUS_BY_CODE.get(dto.status) ?? "open",
    earlyBirdOpen: dto.earlyBirdOpen ?? false,
    ...(Object.keys(registration).length > 0 ? { registration } : {}),
    viewCount: dto.viewCount ?? 0,
    interestCount: dto.interestCount ?? 0,
    interested: dto.interested ?? false,
  };
}

export function toCompetitionDetail(dto: CompetitionDetailDto): Competition {
  return {
    ...toCompetition(dto),
    ...(dto.startTime ? { startTime: dto.startTime.slice(0, 5) } : {}),
    ...(dto.venue ? { venue: dto.venue } : {}),
    ...(dto.host ? { host: dto.host } : {}),
    ...(dto.noticeUrl ? { noticeUrl: dto.noticeUrl } : {}),
    entryLinks: toEntryLinks(dto.entryLinks),
    ...(dto.entrySite ? { entrySite: toEntrySite(dto.entrySite) } : {}),
    fees: (dto.fees ?? []).map(
      (fee): CompetitionFee => ({
        label: fee.label,
        amount: fee.amount,
        ...(fee.until ? { until: fee.until } : {}),
      }),
    ),
    ...(dto.feeNote ? { feeNote: dto.feeNote } : {}),
    ...(dto.lastVerifiedDate ? { verifiedOn: dto.lastVerifiedDate } : {}),
    noticeEnabled: dto.noticeEnabled ?? false,
  };
}

/** 모르는 종류 · http(s)가 아닌 주소는 버린다 — 화면에 엉뚱한 버튼이나 눌리는 이상한 링크가 생기지 않게. */
function toEntryLinks(
  dtos: CompetitionEntryLinkDto[] | null | undefined,
): CompetitionEntryLink[] {
  return (dtos ?? []).flatMap((dto): CompetitionEntryLink[] => {
    const kind = ENTRY_LINK_KIND_BY_CODE[dto.type];
    if (!kind || !isWebUrl(dto.url)) return [];
    const siteName = dto.siteName?.trim();
    return [{ kind, url: dto.url, ...(siteName ? { siteName } : {}) }];
  });
}

/** 모르는 사이트 종류는 기타로 둔다. */
function toEntrySite(dto: {
  type: string;
  name: string | null;
}): CompetitionEntrySite {
  return {
    kind: ENTRY_SITE_KIND_BY_CODE[dto.type] ?? "other",
    name: dto.name?.trim() ?? "",
  };
}
