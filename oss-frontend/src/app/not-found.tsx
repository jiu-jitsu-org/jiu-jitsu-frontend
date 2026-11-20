import { FallbackScreen } from "@/shared/ui/fallback-screen";

/**
 * 없는 주소 · `notFound()` 공통 화면 (#503). Next 영어 기본 404 대신 한국어 안내와 나갈 길(앱 닫기 · 홈으로)을 둔다.
 * 라우트마다 loading.tsx가 있어 대부분 200 스트리밍으로 나가므로 앱은 이 화면을 오류로 알아채지 못한다 —
 * 그래서 화면 안에 나갈 버튼이 있어야 한다.
 */
export default function NotFound() {
  return (
    <FallbackScreen
      title="페이지를 찾을 수 없어요"
      errorShown={{ type: "not_found" }}
    />
  );
}
