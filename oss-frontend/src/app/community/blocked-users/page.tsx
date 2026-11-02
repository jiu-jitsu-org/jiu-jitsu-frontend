import { BlockedMembersScreen } from "@/features/community/presentation/blocked-members/blocked-members-screen";

/**
 * 차단한 회원 라우트 (얇은 엔트리) — /community/blocked-users.
 *
 * 앱(iOS) 설정의 "차단한 회원" 줄이 이 URL을 서브뷰(OPEN_SUBVIEW)로 push만 하고, 화면은 웹이 그린다.
 * 조회 · 렌더는 BlockedMembersScreen(feature)에 위임한다.
 */
export default function CommunityBlockedUsersPage() {
  return <BlockedMembersScreen />;
}
