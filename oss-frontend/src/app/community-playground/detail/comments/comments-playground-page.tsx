import type { CommentSort } from "@/features/community/domain/post";
import { DemoModeProvider } from "@/features/community/presentation/community-demo-context";
import { PostDetailView } from "@/features/community/presentation/post-detail-view";

import {
  MOCK_COMMENTS_LIST,
  MOCK_POST_BASE,
} from "../detail-playground-data";

/**
 * 게시글 상세 (댓글) 쇼케이스 — 디폴트 하단에 댓글 여러 개가 있는 케이스(초안).
 *
 * 정렬 드롭다운 시연을 위해 sort에 따라 mock을 재정렬한다(최신순=작성 역순, 작성된 순=작성순).
 * 실제 라우트에선 업스트림이 정렬해 주므로, 이 정렬은 플레이그라운드 전용이다.
 */
export function PostDetailCommentsPlaygroundPage({
  sort,
}: {
  sort: CommentSort;
}) {
  const items = [...MOCK_COMMENTS_LIST.items].sort((a, b) => {
    const ascending = a.createdAt.localeCompare(b.createdAt);
    return sort === "oldest" ? ascending : -ascending;
  });

  return (
    <DemoModeProvider>
      <PostDetailView
        post={MOCK_POST_BASE}
        comments={{ ...MOCK_COMMENTS_LIST, items }}
        sort={sort}
      />
    </DemoModeProvider>
  );
}
