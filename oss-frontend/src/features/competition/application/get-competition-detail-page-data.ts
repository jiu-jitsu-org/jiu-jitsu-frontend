import { cache } from "react";

import {
  createGetCompetitionDetailUseCase,
  createGetCompetitionStoriesUseCase,
  createRecordCompetitionViewUseCase,
} from "@/features/competition/application/competition-use-case-factory";
import { loadCompetitionAlertSettings } from "@/features/competition/application/load-competition-alert-settings";
import type { Competition } from "@/features/competition/domain/competition";
import type { CompetitionAlertSettings } from "@/features/competition/domain/competition-alert";
import {
  entryLinksOn,
  type CompetitionEntryLink,
} from "@/features/competition/domain/competition-entry-link";
import {
  feeItemsOn,
  type CompetitionFeeItem,
} from "@/features/competition/domain/competition-fee";
import type { CompetitionDetail } from "@/features/competition/domain/competition-repository";
import {
  detailStatusOn,
  scheduleOf,
  shouldPromptResult,
  type CompetitionDetailStatus,
  type CompetitionScheduleItem,
} from "@/features/competition/domain/competition-schedule";
import type { CompetitionStory } from "@/features/competition/domain/competition-story";
import { readSessionToken } from "@/shared/lib/auth";
import { ApiErrorCode, toApiError } from "@/shared/lib/http";

export type CompetitionDetailPageData =
  | {
      ok: true;
      competition: Competition;
      /** 대회 날짜 값이 틀렸으면 null — 상태 줄이 빠진다. */
      status: CompetitionDetailStatus | null;
      schedule: CompetitionScheduleItem[];
      fees: CompetitionFeeItem[];
      /** 지금 단계에 맞는 상태 링크(#469) — 두 개까지. 없으면 빈 배열. */
      entryLinks: CompetitionEntryLink[];
      /** 오늘 — 응답의 today, 한국 날짜 "YYYY-MM-DD" */
      today: string;
      currentYear: number;
      /** 내가 관심 등록했는지 — 비로그인이면 false */
      interested: boolean;
      interestCount: number;
      /** 조회수 — 화면이 열린 뒤 센 값으로 바꾼다(#362). */
      viewCount: number;
      /** 대회 이야기(#366). 읽기 실패면 null — 덩어리째 빠진다. */
      stories: CompetitionStory[] | null;
      /** 결과 남기기 배너를 띄울지(#368) */
      promptResult: boolean;
      /** 관심 대회 마감 알림 설정(#376). 비로그인이거나 못 읽으면 null */
      alertSettings: CompetitionAlertSettings | null;
    }
  | { ok: false; reason: "not-found" | "failed" };

/**
 * 대회 하나 — 한 요청 안에서 한 번만 부른다. generateMetadata(공유 미리보기)와 본문이 같은 상세를 쓴다.
 * 상세 조회는 조회수를 올리지 않으므로 공유 미리보기에서 불러도 된다(#369).
 */
const loadCompetitionDetail = cache(
  async (
    competitionId: number,
    accessToken: string | null,
  ): Promise<CompetitionDetail | null> => {
    try {
      return await createGetCompetitionDetailUseCase(accessToken).execute(
        competitionId,
      );
    } catch (error) {
      // 만료 토큰이면 익명으로 다시 읽는다 — 관심 표시만 빠지고, 화면이 로그인 뒤 다시 그린다.
      if (
        accessToken &&
        toApiError(error).code === ApiErrorCode.EXPIRED_TOKEN
      ) {
        return createGetCompetitionDetailUseCase(null).execute(competitionId);
      }
      throw error;
    }
  },
);

/**
 * 대회 상세 화면 데이터 (#361~#368 · #420).
 *
 * 대회 자체를 못 읽으면 실패지만, 대회 이야기·알림 설정은 못 읽어도 상세는 보여 준다 — 덧붙는 정보 하나 때문에
 * 화면 전체가 실패 화면이 되지 않게. 조회수는 여기서 올리지 않는다 — 사람이 화면을 열었을 때 화면이 센다
 * (서버 렌더는 로그인 뒤 다시 그리기·공유 미리보기에서도 돈다).
 * forPreview면 공유 미리보기용으로 상세만 읽는다(이야기 · 알림 설정은 받지 않는다).
 *
 * 미리보기도 본문과 같은 토큰으로 읽어 같은 조회 결과(React cache)를 쓴다 — 로그인 사용자가 같은 대회를 두 번
 * 조회하지 않게(#443). 로그인으로 달라지는 값은 내 관심 여부 · 이 대회 알림 여부뿐이고 미리보기(competitionShareSummary)는
 * 그 값을 받지 않아 사람마다 같다. 미리보기를 긁어 가는 곳(카카오톡 등)은 쿠키가 없어 늘 익명이다.
 */
export async function getCompetitionDetailPageData({
  competitionId,
  forPreview = false,
}: {
  competitionId: number;
  forPreview?: boolean;
}): Promise<CompetitionDetailPageData> {
  const accessToken = await readSessionToken();
  // 이야기 · 알림 설정은 상세 결과가 필요 없어 상세와 같이 시작한다(#443). 둘 다 실패를 삼켜 먼저 시작해도
  // 거부되지 않는다 — 대회를 못 읽거나 없으면 결과만 버린다.
  const extrasPromise = forPreview
    ? Promise.resolve([null, null] as const)
    : Promise.all([
        loadStories(competitionId, accessToken),
        accessToken ? loadCompetitionAlertSettings() : null,
      ]);
  let detail: CompetitionDetail | null;
  try {
    detail = await loadCompetitionDetail(competitionId, accessToken);
  } catch {
    return { ok: false, reason: "failed" };
  }
  if (!detail) return { ok: false, reason: "not-found" };

  const [stories, alertSettings] = await extrasPromise;

  const { competition, today } = detail;
  const status = detailStatusOn(competition, today);
  return {
    ok: true,
    competition,
    status,
    schedule: scheduleOf(competition, today),
    fees: feeItemsOn(competition.fees, today),
    entryLinks: entryLinksOn(competition, today),
    today,
    currentYear: Number(today.slice(0, 4)),
    interested: competition.interested,
    interestCount: competition.interestCount,
    viewCount: competition.viewCount,
    stories,
    promptResult: shouldPromptResult(status),
    alertSettings,
  };
}

/**
 * 대회 이야기(#366) — 만료 토큰이면 익명으로 다시 읽는다(글 목록은 익명으로도 볼 수 있다). 못 읽으면 null.
 */
async function loadStories(
  competitionId: number,
  accessToken: string | null,
): Promise<CompetitionStory[] | null> {
  try {
    return await createGetCompetitionStoriesUseCase(accessToken).execute(
      competitionId,
    );
  } catch (error) {
    if (accessToken && toApiError(error).code === ApiErrorCode.EXPIRED_TOKEN) {
      return createGetCompetitionStoriesUseCase(null)
        .execute(competitionId)
        .catch(() => null);
    }
    return null;
  }
}

/** 상세를 사람이 연 것으로 센다(#362) — 화면의 Server Action이 마운트 때 한 번 부른다. 실패하면 null. */
export async function recordCompetitionView(
  competitionId: number,
): Promise<number | null> {
  try {
    return await createRecordCompetitionViewUseCase().execute(competitionId);
  } catch {
    return null;
  }
}
