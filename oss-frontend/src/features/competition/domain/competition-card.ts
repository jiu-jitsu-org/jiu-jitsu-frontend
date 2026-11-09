import type { Competition } from "@/features/competition/domain/competition";
import type { RegistrationStatus } from "@/features/competition/domain/competition-registration";

/**
 * 커뮤니티 글이 고른 대회를 보여 줄 카드 한 장 (#379 · #380) — 대회 탭 목록 줄과 같은 내용.
 *
 * 날짜 · 이름 · 장소 · 부문 · 접수 상태와 남은 날 · 관심 수. 끝난 대회는 접수 상태 자리에 '종료'를 둔다.
 */
export type CompetitionCard = {
  competition: Competition;
  /** 접수 일정이 공지되지 않았거나 일정 값이 잘못된 대회는 null */
  registration: RegistrationStatus | null;
  /** 대회 날이 지났는지 */
  ended: boolean;
  /** 내가 관심 등록했는지 — 비로그인이면 false */
  interested: boolean;
  interestCount: number;
  /** 날짜 표기(해가 다르면 연도를 붙인다)의 기준 해 */
  currentYear: number;
};
