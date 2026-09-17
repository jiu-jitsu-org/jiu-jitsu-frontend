import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPostShareMetadata } from "@/features/community/application/get-post-share-metadata";
import { normalizeCommentSort } from "@/features/community/domain/post";
import { PostDetailScreen } from "@/features/community/presentation/post-detail-screen";
import { getRequestOrigin } from "@/shared/lib/request-origin";
import {
  buildShareMetadata,
  summarizeForShare,
} from "@/shared/lib/site-metadata";

type PostPageParams = Promise<{ id: string }>;

/** URL의 id를 정수 postId로 푼다. 잘못된 URL이면 null. */
function parsePostId(id: string): number | null {
  const postId = Number(id);
  return Number.isInteger(postId) && postId > 0 ? postId : null;
}

/**
 * 공유 미리보기(카카오톡 등) 메타데이터 — 제목 · 본문 요약 · 대표 이미지.
 *
 * 요약을 실패하면(없는 글·네트워크 등) 루트 기본 메타데이터로 둔다. 실제 에러 화면 분기는
 * 같은 조회를 공유하는 PostDetailScreen이 담당하므로 여기서는 미리보기만 포기한다.
 */
export async function generateMetadata({
  params,
}: {
  params: PostPageParams;
}): Promise<Metadata> {
  const { id } = await params;
  const postId = parsePostId(id);
  if (postId === null) return {};

  const [share, origin] = await Promise.all([
    getPostShareMetadata(postId),
    getRequestOrigin(),
  ]);
  if (!share) return {};

  return buildShareMetadata({
    metadataBase: origin,
    title: share.title,
    description: summarizeForShare(share.body),
    imageUrl: share.imageUrl,
  });
}

/**
 * 게시글 상세 라우트 (얇은 엔트리).
 *
 * Next.js 16: params/searchParams는 Promise이므로 await로 푼다.
 * 라우팅·파라미터 추출만 담당하고 데이터 조회/렌더는 PostDetailScreen(feature)에 위임한다.
 */
export default async function CommunityPostPage({
  params,
  searchParams,
}: {
  params: PostPageParams;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { id } = await params;
  const { sort } = await searchParams;

  const postId = parsePostId(id);
  if (postId === null) {
    notFound();
  }

  return (
    <PostDetailScreen postId={postId} sort={normalizeCommentSort(sort)} />
  );
}
