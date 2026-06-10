import { normalizeCommentSort } from "@/features/community/domain/post";
import { PostDetailScreen } from "@/features/community/presentation/post-detail-screen";

/**
 * 게시글 상세 (API 테스트) — `/community-playground/detail/api-test`.
 *
 * mock/데모 모드가 아니라 실제 데이터 경로(PostDetailScreen → application → infrastructure → BFF/업스트림)를
 * 그대로 탄다. API를 하나씩 붙여가며 검증하는 용도. `?id=`로 대상 게시글, `?sort=`로 댓글 정렬 지정.
 *
 * 참고: 실제 업스트림(API_BASE_URL)과 세션이 필요하다. 현재는 업스트림 TLS(자체서명) 미해결이라 에러 화면일 수 있음.
 */
export default async function CommunityDetailApiTestPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; sort?: string }>;
}) {
  const { id, sort } = await searchParams;
  const parsed = Number(id);
  // 기본 테스트 대상 게시글 id(임시). ?id=로 덮어쓸 수 있다.
  const postId = Number.isInteger(parsed) && parsed > 0 ? parsed : 3;

  return <PostDetailScreen postId={postId} sort={normalizeCommentSort(sort)} />;
}
