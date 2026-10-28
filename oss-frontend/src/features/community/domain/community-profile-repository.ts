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
}
