"use client";

import { useEffect } from "react";

import type { BannerSlotItem } from "@/features/competition/domain/competition-banner-slot";
import type { CompetitionInfoReportReason } from "@/features/competition/domain/competition-info-report";
import { competitionRegionSlug } from "@/features/competition/domain/competition-list-view-state";
import type { CompetitionListMode } from "@/features/competition/domain/competition-list-view-state";
import type { CompetitionRegion } from "@/features/competition/domain/competition-region";
import type { CompetitionDetailStatus } from "@/features/competition/domain/competition-schedule";
import { competitionDetailOpenCount } from "@/features/competition/presentation/competition-detail-link";
import {
  contentIdOf,
  currentScreenFrom,
  track,
  type ScreenFrom,
} from "@/shared/lib/analytics";

/**
 * 대회 기록(GA, #620)의 이벤트와 꼬리표 값 — 사전 GA-07. 값은 사전에 적힌 것만 싣는다(닫힌 타입).
 * 대회 id는 `comp_45` 형식(`contentIdOf`), 기록이 실패해도 화면 동작은 그대로다(`track`은 던지지 않는다).
 */

/** 그 순간 대회 상세가 보여 주는 단계(사전 `reg_status`). */
export type CompetitionRegStatus =
  | "unannounced"
  | "upcoming"
  | "early_bird"
  | "open"
  | "closed"
  | "today"
  | "ended";

/** 상세 상태(`detailStatusOn`) → `reg_status`. 접수 중은 얼리버드 마감이 남았으면 early_bird. 상태를 모르면 뺀다. */
export function regStatusOf(
  status: CompetitionDetailStatus | null,
): CompetitionRegStatus | undefined {
  if (!status) return undefined;
  if (status.kind === "open") {
    return status.deadline === "early-bird" ? "early_bird" : "open";
  }
  return status.kind;
}

/** 관심 하트를 누른 자리(사전 `from`). 바닥 바 하트는 바가 있을 때만 있고, 그때 요약 알약은 숨는다. */
export type CompetitionInterestFrom =
  | "competition_list"
  | "competition_calendar"
  | "feed_competition_card"
  | "post_competition_card"
  | "competition_detail"
  | "competition_bar"
  | "alert_bell";

/** 관심 등록 · 해제가 서버에 남은 뒤 한 번(`competition_interest`). */
export function trackCompetitionInterest(
  competitionId: number,
  interested: boolean,
  from: CompetitionInterestFrom,
  regStatus: CompetitionRegStatus | undefined,
): void {
  track("competition_interest", {
    state: interested ? "on" : "off",
    competition_id: contentIdOf("competition", competitionId),
    from,
    reg_status: regStatus,
  });
}

/** 대회 목록 필터를 켜거나 끔(`competition_filter_apply`). 지역은 시트의 '적용' — 고른 지역을 쉼표로 이어 싣는다. */
export function trackCompetitionFilter(
  change:
    | { filter: "open" | "interest"; on: boolean }
    | { filter: "region"; regions: readonly CompetitionRegion[] },
): void {
  if (change.filter === "region") {
    track("competition_filter_apply", {
      filter: "region",
      state: change.regions.length > 0 ? "on" : "off",
      region:
        change.regions.length > 0
          ? change.regions.map(competitionRegionSlug).join(",")
          : undefined,
    });
    return;
  }
  track("competition_filter_apply", {
    filter: change.filter,
    state: change.on ? "on" : "off",
  });
}

/** 목록 ↔ 달력, 달력의 달 이동 · 달 고르기 · 날짜 칸(`competition_view_change`). view는 바뀐 뒤 보기. */
export function trackCompetitionViewChange(
  view: CompetitionListMode,
  action: "switch" | "prev_month" | "next_month" | "pick_month" | "pick_date",
): void {
  track("competition_view_change", { view, action });
}

/** 배너 종류(사전 `banner`) — 곧 열려요는 코드에서 `event`다. */
export type CompetitionBanner =
  "deadline" | "opening" | "result" | "detail_result";

export type CompetitionBannerParams = {
  banner: CompetitionBanner;
  competitionId: number;
};

/** 대회 탭 배너 자리의 한 장 → 기록 꼬리표. 결과 남기기 배너는 한 장에 대회 하나다. */
export function bannerParamsOf(
  item: BannerSlotItem,
): CompetitionBannerParams | null {
  switch (item.kind) {
    case "deadline":
      return {
        banner: "deadline",
        competitionId: item.deadline.competition.id,
      };
    case "event":
      return { banner: "opening", competitionId: item.event.competition.id };
    case "result": {
      const [competition] = item.group.competitions;
      return competition
        ? { banner: "result", competitionId: competition.id }
        : null;
    }
  }
}

/** 배너가 보인 뒤 이만큼 떠 있으면 본 것으로 센다(ms). */
const BANNER_VIEW_DELAY = 600;

/**
 * 배너가 보인 뒤 600ms 떠 있으면 `banner_view` 한 번 — 화면 기록(`screen_view`)이 다시 세는 때에 맞춘다.
 * - 같은 화면에서 다시 그려지면(관심 값 갱신 · router.refresh) 다시 세지 않는다.
 * - 다시 붙으면 다시 센다(브라우저 뒤로 가기 · 목록 ↔ 달력 — 둘 다 새 screen_view).
 * - 이 화면에서 대회 상세를 열었다가 돌아와 다시 보이면 다시 센다(앱은 상세 서브뷰가 닫히면 목록 웹뷰에
 *   visibilitychange가 온다 — `useRefreshAfterDetail`과 같은 신호, 앱도 screen_view를 다시 센다).
 *   그 밖에 숨었다 보이는 것(앱을 내렸다 올림 · 브라우저 탭 전환)은 다시 세지 않는다 — 앱은 다른 탭을 볼 때도 대회 탭
 *   웹뷰를 투명하게만 숨겨 두어, 이때 다시 세면 보이지 않는 배너가 쌓인다.
 * - 문서가 숨어 있으면 세지 않고 보이게 되면 그때부터 센다. 600ms 전에 사라지면(닫기 시작 — 호출부가 null을 넘김 ·
 *   달력으로 바꿈) 세지 않는다.
 * 앱 탭바로 대회 탭에 돌아오는 것은 웹에 신호가 없어 다시 세지 않는다. 앱이 미리 불러 둔 탭 문서가 visible이면
 * 처음 열기 전에 셀 수 있다 — 실기기 확인 대상.
 */
export function useBannerView(params: CompetitionBannerParams | null): void {
  const banner = params?.banner;
  const competitionId = params?.competitionId;
  useEffect(() => {
    if (!banner || competitionId === undefined) return;
    let timer = 0;
    // 센 때의 상세 연 횟수 — 그 뒤 상세를 열었다 돌아오면 다시 센다. null이면 아직 안 셈.
    let countedAt: number | null = null;
    const start = () => {
      if (timer || document.visibilityState !== "visible") return;
      if (countedAt !== null && countedAt === competitionDetailOpenCount())
        return;
      // 600ms 안에 상세를 열면(목록이 숨기 전에 타이머가 끝나도) 지나간 것으로 보고 세지 않는다 — 돌아와 다시 보일 때 센다.
      const openCount = competitionDetailOpenCount();
      timer = window.setTimeout(() => {
        timer = 0;
        if (competitionDetailOpenCount() !== openCount) return;
        countedAt = openCount;
        track("banner_view", {
          banner,
          competition_id: contentIdOf("competition", competitionId),
        });
      }, BANNER_VIEW_DELAY);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") return start();
      window.clearTimeout(timer);
      timer = 0;
    };
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [banner, competitionId]);
}

/** 배너를 누르거나 닫음(`banner_click`). record = '내 기록에 남기기' · '남기기'. */
export function trackBannerClick(
  params: CompetitionBannerParams,
  action: "open" | "dismiss" | "record",
): void {
  track("banner_click", {
    banner: params.banner,
    competition_id: contentIdOf("competition", params.competitionId),
    action,
  });
}

/** 바깥 링크 종류(사전 `link_type`). 바닥 바 상태 링크의 코드 종류 → 사전 값은 바(`competition-entry-links.tsx`)가 바꾼다. */
export type CompetitionLinkType =
  | "registration"
  | "entry_list"
  | "bracket"
  | "live_mat"
  | "result"
  | "organizer_site"
  | "notice";

/**
 * 대회 상세에 들어온 처음 입구. 브라우저에서 뒤로 가기로 상세가 다시 보이면 화면 기록의 from이 `back`이라
 * (사전: screen_view만, 입구 집계에서 뺌) 처음 입구를 이 문서에 기억해 두고 쓴다.
 */
const detailEntryFroms = new Map<number, ScreenFrom>();

function detailEntryFrom(competitionId: number): ScreenFrom | undefined {
  const from = currentScreenFrom();
  if (from && from !== "back") {
    detailEntryFroms.set(competitionId, from);
    return from;
  }
  return detailEntryFroms.get(competitionId);
}

/** 상세가 그려질 때 처음 입구를 기억한다 — 화면 기록은 그리기 전에(문서 로드 · 라우터 이동 시작) 정해진다. */
export function useRememberDetailEntry(competitionId: number): void {
  useEffect(() => {
    detailEntryFrom(competitionId);
  }, [competitionId]);
}

/**
 * 대회 상세의 바깥 링크를 누름(`competition_link_click`, 주요 이벤트). 링크는 그대로 열린다(기본 동작을 막지 않는다).
 * from은 대회 상세에 들어온 처음 입구 — 어느 입구가 바깥 링크까지 이어지는지 본다.
 */
export function trackCompetitionLinkClick(
  competitionId: number,
  linkType: CompetitionLinkType,
  regStatus: CompetitionRegStatus | undefined,
): void {
  track("competition_link_click", {
    competition_id: contentIdOf("competition", competitionId),
    link_type: linkType,
    reg_status: regStatus,
    from: detailEntryFrom(competitionId),
  });
}

/** '잘못된 정보 알려 주기' 제출이 서버에 남은 뒤(`competition_info_report`). 적은 글은 싣지 않는다. */
export function trackCompetitionInfoReport(
  competitionId: number,
  reason: CompetitionInfoReportReason,
): void {
  track("competition_info_report", {
    competition_id: contentIdOf("competition", competitionId),
    reason,
  });
}
