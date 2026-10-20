import type { BlockedMember } from "@/features/community/domain/blocked-member";

/**
 * (dev 전용) 차단한 회원 화면 확인용 예시 데이터 — `next dev`에서 `?sample=1`(목록) · `?sample=empty`(빈 화면).
 *
 * 목록 API(GET /user/block)가 아직 없어 화면을 눈으로 확인할 방법이 없어 둔다. 판정은
 * get-blocked-members-page-data가 isDevelopmentRuntime()으로 하므로 production 빌드에선 쓰이지 않는다.
 * 백엔드 API가 붙고 실제 데이터로 확인할 수 있게 되면 이 파일과 sample 분기를 지운다.
 *
 * 긴 닉네임(말줄임 확인) · 사진 있음/없음을 섞었다. 사진은 저장소에 있는 공개 이미지를 빌려 쓴다.
 */
export type BlockedMembersSampleMode = "list" | "empty";

export function readBlockedMembersSampleMode(
  value: string | string[] | undefined,
): BlockedMembersSampleMode | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "1") return "list";
  if (raw === "empty") return "empty";
  return null;
}

export const BLOCKED_MEMBERS_SAMPLE: BlockedMember[] = [
  {
    userId: 900001,
    nickname: "주짓수하는곰",
    profileImageUrl: "/images/balance/character-a-default.png",
    blockedAt: "2026-10-19T09:00:00Z",
  },
  {
    userId: 900002,
    nickname: "블루벨트",
    profileImageUrl: null,
    blockedAt: "2026-10-12T09:00:00Z",
  },
  {
    userId: 900003,
    nickname: "가드패스는언제나어려워요매일연습하는중인화이트벨트",
    profileImageUrl: "/images/balance/character-b-default.png",
    blockedAt: "2026-09-30T09:00:00Z",
  },
  {
    userId: 900004,
    nickname: "새벽오픈매트",
    profileImageUrl: null,
    blockedAt: "2026-09-02T09:00:00Z",
  },
];
