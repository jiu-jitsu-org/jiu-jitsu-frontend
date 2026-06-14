import { normalizeCommentSort } from "@/features/community/domain/post";
import { PostDetailScreen } from "@/features/community/presentation/post-detail-screen";

/**
 * 게시글 상세 (API 테스트) — `/community-playground/detail/api-test`.
 *
 * mock/데모 모드가 아니라 실제 데이터 경로(PostDetailScreen → application → infrastructure → BFF/업스트림)를
 * 그대로 탄다. API를 하나씩 붙여가며 검증하는 용도.
 *
 * id 미지정 시 입력 폼을 띄워 테스터가 직접 대상 게시글 id를 넣는다(고정 기본값 없음).
 * `?id=`로 대상 게시글을 지정한다(폼이 이 쿼리를 채운다). 댓글 정렬은 `?sort=`로만 받는다(기본 최신순).
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
  const postId = Number.isInteger(parsed) && parsed > 0 ? parsed : null;

  // id가 없거나 유효하지 않으면 입력 폼을 보여준다(고정 3 제거).
  if (postId === null) {
    return <PostIdPrompt invalid={id !== undefined && id !== ""} />;
  }

  return <PostDetailScreen postId={postId} sort={normalizeCommentSort(sort)} />;
}

/**
 * 테스트할 게시글 id 입력 폼(서버 컴포넌트, 클라이언트 JS 불필요).
 *
 * GET 폼이라 제출하면 같은 경로로 `?id=`가 붙어 재요청 → 위 분기에서 상세를 렌더한다.
 */
function PostIdPrompt({ invalid }: { invalid: boolean }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-base font-medium text-text-primary">
          게시글 상세 API 테스트
        </h1>
        <p className="text-sm text-text-tertiary">
          조회할 게시글 id를 입력하세요.
        </p>
      </div>

      <form method="get" className="flex w-full max-w-xs flex-col gap-3">
        <input
          type="number"
          name="id"
          min={1}
          required
          autoFocus
          placeholder="게시글 id (예: 3)"
          className="h-11 rounded-lg border border-[#D3D3D3] px-3 text-base text-text-primary outline-none"
        />
        <button
          type="submit"
          className="h-11 rounded-lg bg-button-filled-default-bg text-base font-medium text-button-filled-default-text"
        >
          조회
        </button>
      </form>

      {invalid ? (
        <p className="text-sm text-[#E52012]">
          유효한 id(1 이상 정수)를 입력하세요.
        </p>
      ) : null}
    </main>
  );
}
