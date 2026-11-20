import { FallbackScreen } from "@/shared/ui/fallback-screen";

/**
 * 열 수 없는 대회(내려감 · 비공개 · 없는 id)에 들어왔을 때의 화면 (#503).
 *
 * WHY 404가 아닌가: 라우트에 loading.tsx가 있어 `notFound()`도 200 스트리밍으로 나가고, 앱은 그걸 오류로
 * 알아채지 못한 채 영어 기본 화면을 띄웠다. 안내와 나갈 길을 직접 그린다.
 *
 * WHY 글처럼 자동으로 닫지 않는가(PostDetailGone): 대회 상세는 대회 탭 · 피드 카드 · 알림함 · 공유 링크에서
 * 열리는데, 돌아간 화면이 남긴 토스트를 띄워 주는 건 피드 · 알림함뿐이다. 대회 탭에서 연 경우 아무 말 없이
 * 닫히게 되므로 이 화면에서 안내하고 닫기를 누르게 한다.
 */
export function CompetitionDetailGone() {
  return (
    <FallbackScreen
      title="찾을 수 없는 대회예요"
      description="내려갔거나 주소가 잘못된 대회예요."
      browserLink={{ href: "/competition", label: "대회 목록 보기" }}
      errorShown={{ type: "not_found", contentType: "competition" }}
    />
  );
}
