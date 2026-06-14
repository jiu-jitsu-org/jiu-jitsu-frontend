import type { ReactNode } from "react";

import { getBoardListPageData } from "@/features/community/application/get-board-list-page-data";
import { DEFAULT_BOARD_LIST_QUERY } from "@/features/community/domain/post-summary";
import { CommunityFeedList } from "@/features/community/presentation/community-feed-list";
import { PostWriteFab } from "@/features/community/presentation/post-write-fab";

/**
 * 메인 화면 — 커뮤니티 게시글 피드.
 *
 * Server Component가 초기 목록을 조회(GET /board)해 FeedCard 목록으로 렌더한다.
 * 데이터 조회는 application page data query에 위임하고(page는 라우팅/조립만),
 * 로딩은 같은 라우트의 loading.tsx, 카드 상호작용은 client 컴포넌트가 담당한다.
 * 개발용 진입 허브/playground는 `src/app/_backup/`에 보관돼 있다.
 */
export default async function Home() {
  const result = await getBoardListPageData(DEFAULT_BOARD_LIST_QUERY);

  return (
    <main className="min-h-screen bg-[var(--bw-white)]">
      {!result.ok ? (
        <FeedMessage>게시글을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</FeedMessage>
      ) : result.data.list.items.length === 0 ? (
        <FeedMessage>아직 게시글이 없어요.</FeedMessage>
      ) : (
        <CommunityFeedList
          posts={result.data.list.items}
          isLast={result.data.list.isLast}
        />
      )}

      {/* 게시글 작성 진입 FAB — 네이티브면 OPEN_SUBVIEW로 풀스크린 서브뷰, 웹 단독이면 라우터 이동. */}
      <PostWriteFab />
    </main>
  );
}

/** 빈/에러 상태 안내 문구(피드 영역 중앙). */
function FeedMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 text-center text-sm text-feed-card-body-text">
      {children}
    </div>
  );
}
