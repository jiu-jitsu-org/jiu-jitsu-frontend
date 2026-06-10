import { PostDetailPlaygroundPage } from "../post-detail-playground-page";

/**
 * 게시글 상세 (디폴트) — 현재 연결된 레이아웃을 mock으로 보여주는 경로
 * (`/community-playground/detail/default`).
 *
 * `?owner=1`이면 내 게시글로 보여줘 헤더 ⋮ 메뉴(삭제/수정)를 시연한다(없으면 타인 게시글).
 */
export default async function CommunityDetailDefaultPlayground({
  searchParams,
}: {
  searchParams: Promise<{ owner?: string }>;
}) {
  const { owner } = await searchParams;

  return <PostDetailPlaygroundPage isOwner={owner === "1"} />;
}
