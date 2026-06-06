import { CommunityPlaygroundPage } from "./community-playground-page";

/**
 * 커뮤니티 공통 UI 컴포넌트 쇼케이스 경로(`/community-playground`).
 *
 * page는 서버 컴포넌트로 유지하고, 인터랙션은 leaf 클라이언트 컴포넌트로 분리한다.
 */
export default function CommunityPlayground() {
  return <CommunityPlaygroundPage />;
}
