import type { Belt } from "@/features/community/domain/belt";

/**
 * 내 커뮤니티 프로필 저장소 계약 (#275) — 띠 묻기 시트가 쓰는 만큼만 둔다.
 *
 * 원본은 업스트림 GET·POST /community/profile이다. 로그인 전용이라 구현체는 authed HttpClient로만 조립한다.
 */
export interface CommunityProfileRepository {
  /** 내 띠·그랄. 아직 입력하지 않았으면 null. */
  getMyBelt(): Promise<Belt | null>;
  /** 내 띠·그랄을 저장한다. 성별·체급 등 같은 묶음의 다른 값은 그대로 둔다. */
  saveMyBelt(belt: Belt): Promise<void>;
  /**
   * 내 대회 기록에 걸린 대회 id(#545) — 등록 대회에서 고른 기록만. 대회 이름을 직접 입력한 기록은 id가 없어 빠진다.
   * 대회 상세 · 대회 탭이 이미 기록한 대회에 결과 남기기를 다시 묻지 않는 데 쓴다.
   */
  getMyRecordedCompetitionIds(): Promise<number[]>;
}
