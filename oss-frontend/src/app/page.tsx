import { AuthPlaygroundPage } from "@/features/auth/presentation/auth-playground-page";

/**
 * 메인 화면(임시): 인증/세션 테스트 하니스.
 *
 * page는 서버 컴포넌트로 유지하고, 인터랙션은 leaf 클라이언트 컴포넌트로 분리한다.
 * 원래 랜딩은 `src/app/_backup/home-page-original.tsx`에 보관돼 있다.
 */
export default function Home() {
  return <AuthPlaygroundPage />;
}
