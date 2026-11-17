import type { Competition } from "@/features/competition/domain/competition";
import { isDateKey } from "@/features/competition/domain/competition-registration";
import {
  dateRangeLabel,
  longDateLabel,
} from "@/features/competition/presentation/competition-detail-format";

/**
 * 공유 미리보기 설명 줄(#369 · #540) — "2026년 11월 29일(일) · 서울 성북구 · 접수 ~11월 22일(일)".
 * 여러 날 대회는 "… ~ 30일(월)".
 *
 * 받는 사람이 먼저 궁금한 건 "아직 신청돼?"라 접수 마감일을 붙인다. 카카오톡 등은 미리보기를 캐시해 오래 보여 주므로
 * 언제 봐도 맞는 고정 날짜만 쓴다 — '접수 중' · 'D-3' · 관심 수처럼 공유 뒤 바뀌는 값은 넣지 않는다.
 * 대회 날짜는 해가 바뀐 뒤에 볼 수도 있어 늘 연도를 붙이고, 마감일은 대회와 해가 다를 때만 붙인다.
 * 마감일을 모르면 날짜 · 장소만. 얼리버드 마감은 설명이 길어져 잘리므로 넣지 않는다.
 * 로그인 조회 결과로도 그려지므로(#443) 사람마다 같은 값만 받는다 — 내 관심 여부 · 알림 여부가 섞이지 않게
 * 인자를 이 필드들로 좁혀 둔다.
 */
export function competitionShareSummary(data: {
  competition: Pick<Competition, "date" | "endDate" | "place" | "registration">;
}): string {
  const { competition } = data;
  const closesOn = competition.registration?.closesOn;
  return [
    dateRangeLabel(competition.date, competition.endDate, null),
    competition.place.trim(),
    closesOn && isDateKey(closesOn)
      ? `접수 ~${longDateLabel(closesOn, Number(competition.date.slice(0, 4)))}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
}
