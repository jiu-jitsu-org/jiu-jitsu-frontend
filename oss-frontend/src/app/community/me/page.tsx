import { SessionHintProvider } from "@/features/auth/presentation/session-hint";
import { MyActivityScreen } from "@/features/community/presentation/my-activity/my-activity-screen";
import { normalizeMyActivityTab } from "@/features/community/presentation/my-activity/my-activity-tab";
import { readSessionToken } from "@/shared/lib/auth";

/**
 * 내 커뮤니티 활동 라우트 (얇은 엔트리) — /community/me?tab=posts(기본) | saved.
 *
 * 네이티브는 자기 진입점에서 이 URL을 서브뷰(OPEN_SUBVIEW)로 연다. 탭을 URL에 두어 특정 탭으로
 * 바로 열 수 있다. 데이터 조회 · 렌더는 MyActivityScreen(feature)에 위임한다.
 */
export default async function CommunityMyActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const { tab } = await searchParams;
  const sessionToken = await readSessionToken();

  // 카드 ⋮ · 좋아요 가드가 로그인 여부로 갈린다 — 세션 판정 전에도 맞게 그리도록 힌트를 깐다(#173).
  return (
    <SessionHintProvider authenticated={sessionToken !== null}>
      <MyActivityScreen tab={normalizeMyActivityTab(tab)} />
    </SessionHintProvider>
  );
}
