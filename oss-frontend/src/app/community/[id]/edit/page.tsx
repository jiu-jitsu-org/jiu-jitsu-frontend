import { notFound } from "next/navigation";

import type { PostEditInitial } from "@/features/community/domain/post";
import { PostWriteScreen } from "@/features/community/presentation/post-write-screen";

/**
 * FIXME(api-connect): 목 초기값. 연결 시 getPostDetail 유스케이스로 상세를 읽어 PostEditInitial로
 * 추리고(본인 글이 아니면 notFound 또는 상세로 되돌림), 이 상수는 지운다.
 */
const MOCK_INITIAL: PostEditInitial = {
  categoryId: 4,
  title: "도복 골라주셈",
  body: "도복 나이키 브랜드랑 아디다스 고민중인데 님들 눈엔 뭐가 나음?",
  images: [
    { id: 1, imageUrl: "https://picsum.photos/id/1011/800/1000" },
    { id: 2, imageUrl: "https://picsum.photos/id/1015/1200/800" },
    { id: 3, imageUrl: "https://picsum.photos/id/1025/900/900" },
  ],
  tags: ["도복", "장비추천"],
};

/**
 * 게시글 수정 라우트 (얇은 엔트리). 피드/상세 ⋮ 메뉴의 "수정하기"(useOpenPostEdit)가 여는 화면.
 *
 * 작성 화면(PostWriteScreen)을 수정 모드로 재사용한다 — 같은 폼이라 화면을 따로 두면 중복(#44).
 */
export default async function CommunityPostEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isInteger(postId) || postId <= 0) {
    notFound();
  }

  return <PostWriteScreen edit={{ postId, initial: MOCK_INITIAL }} />;
}
