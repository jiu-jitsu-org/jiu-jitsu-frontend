import { readBlockedMembersSampleMode } from "@/features/community/application/blocked-members-sample";
import { BlockedMembersScreen } from "@/features/community/presentation/blocked-members/blocked-members-screen";

/**
 * 차단한 회원 라우트 (얇은 엔트리) — /community/blocked-users.
 *
 * 앱(iOS) 설정의 "차단한 회원" 줄이 이 URL을 서브뷰(OPEN_SUBVIEW)로 push만 하고, 화면은 웹이 그린다.
 * 조회 · 렌더는 BlockedMembersScreen(feature)에 위임한다.
 * `?sample=1|empty`는 `next dev` 전용 예시 데이터다(production에선 무시 — blocked-members-sample).
 */
export default async function CommunityBlockedUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ sample?: string | string[] }>;
}) {
  const { sample } = await searchParams;

  return (
    <BlockedMembersScreen sampleMode={readBlockedMembersSampleMode(sample)} />
  );
}
