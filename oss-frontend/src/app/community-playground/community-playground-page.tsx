"use client";

import { useState } from "react";

import { useOpenPostDetail } from "@/features/community/presentation/use-open-post-detail";
import { BackButton, FeedCard, FeedListEnd, type FeedCardProps } from "@/shared/ui";

const SAMPLE_IMAGE = "https://picsum.photos/seed/oss/800/450";

const SHORT_BODY = "본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문";
const LONG_BODY =
  "본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문 본문";

/**
 * 커뮤니티 피드 공통 UI 쇼케이스 (개발용).
 *
 * 실제 커뮤니티 메인처럼 FeedCard를 세로로 나열한다(상단 탭·헤더·하단 네비·FAB는 네이티브 영역이라 제외).
 * 카드 양옆 마진 16, 카드 사이 간격 16.
 */
export function CommunityPlaygroundPage() {
  return (
    <main className="min-h-screen bg-[var(--bw-white)]">
      <BackButton />
      {/* 카드 좌우 인셋 16은 카드 자체 px-4가 담당(이중 패딩 방지). 카드 사이 간격 16. */}
      <div className="flex flex-col gap-4 py-4">
        {/* 글 길이 짧은 경우 (댓글 남긴 상태 = 댓글 아이콘 채움) */}
        <FeedCardDemo
          postId={1}
          author={{ name: "안녕안녕"}}
          createdAt="2026-02-14"
          title="제목 제목 제목 제목 제목 제목 제목 제목 제목 제목 제목"
          body={SHORT_BODY}
          counts={{ comments: 1, likes: 1, bookmarks: 1 }}
          commented
        />

        {/* 글 길이 3줄 이상 (더보기) */}
        <FeedCardDemo
          postId={2}
          author={{ name: "안녕안녕"}}
          createdAt="2026-02-14"
          title="제목 제목 제목 제목 제목 제목 제목 제목 제목 제목 제목"
          body={LONG_BODY}
          counts={{ comments: 1, likes: 1, bookmarks: 1 }}
        />

        {/* 이미지 포함 게시물 */}
        <FeedCardDemo
          postId={3}
          author={{ name: "안녕안녕"}}
          createdAt="2026-02-14"
          title="제목 제목 제목 제목 제목 제목 제목 제목 제목 제목 제목"
          body={SHORT_BODY}
          images={[
            { url: SAMPLE_IMAGE, alt: "샘플 이미지", width: 800, height: 450 },
            { url: SAMPLE_IMAGE, alt: "샘플 이미지", width: 800, height: 450 },
          ]}
          counts={{ comments: 0, likes: 0, bookmarks: 0 }}
        />

        {/* 더 불러올 게시물이 없을 때(피드 최하단) 끝 표식 노출 */}
        <FeedListEnd />
      </div>
    </main>
  );
}

/**
 * controlled 상태 소유 데모.
 * 실제 앱에서는 ViewModel/서버상태가 가질 liked·bookmarked를 여기서 useState로 시연한다.
 */
function FeedCardDemo(
  props: Omit<
    FeedCardProps,
    "liked" | "bookmarked" | "onToggleLike" | "onToggleBookmark" | "onPress"
  > & { postId: number },
) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const openPostDetail = useOpenPostDetail();
  const { counts, postId, ...rest } = props;

  return (
    <FeedCard
      {...rest}
      counts={{
        ...counts,
        likes: counts.likes + (liked ? 1 : 0),
        bookmarks: counts.bookmarks + (bookmarked ? 1 : 0),
      }}
      liked={liked}
      bookmarked={bookmarked}
      // 카드 탭 → 네이티브면 OPEN_SUBVIEW(풀 웹뷰), 웹이면 라우터 이동.
      onPress={() => openPostDetail(postId)}
      onToggleLike={() => setLiked((v) => !v)}
      onToggleBookmark={() => setBookmarked((v) => !v)}
      onPressMore={() => {}}
    />
  );
}
