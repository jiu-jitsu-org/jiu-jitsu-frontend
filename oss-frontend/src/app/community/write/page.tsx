import { PostWriteScreen } from "@/features/community/presentation/post-write-screen";

/**
 * 게시글 작성 라우트 (얇은 엔트리).
 *
 * 작성 화면은 전 영역이 인터랙티브하므로 데이터 조회 없이 클라이언트 화면(PostWriteScreen)에 위임한다.
 */
export default function CommunityWritePage() {
  return <PostWriteScreen />;
}
