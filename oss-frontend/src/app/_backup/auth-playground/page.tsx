import { AuthPlaygroundPage } from "@/features/auth/presentation/auth-playground-page";

/**
 * 인증/세션 테스트 하니스 경로(`/auth-playground`).
 *
 * page는 서버 컴포넌트로 유지하고, 인터랙션은 leaf 클라이언트 컴포넌트로 분리한다.
 * 메인(`/`)에서 진입 버튼으로 연결된다.
 */
export default function AuthPlayground() {
  return <AuthPlaygroundPage />;
}
