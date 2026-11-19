"use client";

import { useOpenPostDetail } from "@/features/community/presentation/use-open-post-detail";
import { cn } from "@/shared/lib/cn";
import { Divider } from "@/shared/ui/divider";
import { SURFACE_PRESS } from "@/shared/ui/press-styles";
import { RelativeTime } from "@/shared/ui/relative-time";

export type CategoryMorePost = {
  id: number;
  title: string;
  /** 본문 미리보기 — 줄바꿈은 빈칸으로 접는다. 내용 없는 글(#589)은 빈 문자열. */
  body: string;
  comments: number;
  /** 글을 올린 때(ISO 8601). */
  createdAt: string;
};

/**
 * "○○의 다른 글" 목록(#594) — 카드를 누르면 그 글 상세가 열린다(피드 카드와 같은 길, 앱은 새 서브뷰).
 *
 * 댓글과는 본문↔댓글과 같은 4px 띠(Divider)로 나눈다 — 선 대신 면으로 나누는 큰 덩어리 구분.
 * 옅은 회색 카드를 가로로 밀어 본다: 제목 한 줄 + 본문 두 줄 + 보조 한 줄(댓글 수 · 시간).
 * 카드 폭 280 — 393 화면에서 다음 카드가 끝에 걸쳐 "밀면 더 있다"가 보인다.
 * 본문 칸은 두 줄 높이(42)를 늘 잡아 본문 길이가 달라도 카드 높이가 같다.
 * 구역 제목은 글 제목(Title 3)보다 한 단계 낮은 Body M 굵게 — 지금 글보다 앞에 나서지 않게.
 */
export function PostCategoryMoreList({
  title,
  posts,
}: {
  title: string;
  posts: CategoryMorePost[];
}) {
  // 열람 기록(GA)의 입구는 '같은 카테고리의 다른 글'(#619) — 주지 않으면 지금 화면(post_detail)으로 남는다.
  const openPost = useOpenPostDetail("related_posts");

  return (
    <>
      {/* 댓글 끝 ↔ 띠 24 = 댓글 목록 하단 여백 16 + 8 — 액션바 ↔ 띠(mt-6)와 같은 간격. */}
      <Divider className="mt-2" />
      <section className="pb-6 pt-6">
        <h2 className="px-4 text-body-m font-semibold text-text-primary">
          {title}
        </h2>
        {/* 가로 줄은 화면 끝까지 — 첫 카드만 제목과 같은 세로선(16)에 서고, 밀면 카드가 화면 끝에서 잘린다. */}
        <ul className="mt-3 flex snap-x snap-mandatory scroll-px-4 gap-2 overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {posts.map((post, index) => (
            <li key={post.id} className="w-[280px] shrink-0 snap-start">
              <button
                type="button"
                onClick={() =>
                  openPost(post.id, null, { position: index + 1 })
                }
                className={cn(
                  "flex w-full flex-col rounded-20 bg-surface-field-subtle px-5 py-[18px] text-left",
                  SURFACE_PRESS,
                )}
              >
                <span className="w-full truncate text-body-m font-semibold text-feed-card-body-title-text">
                  {post.title}
                </span>
                <span className="mt-1 line-clamp-2 min-h-[42px] wrap-anywhere text-body-s text-feed-card-body-text">
                  {post.body}
                </span>
                <span className="mt-3 text-label-m text-feed-card-header-date-text tabular-nums">
                  {post.comments > 0 ? `댓글 ${post.comments} · ` : ""}
                  <RelativeTime iso={post.createdAt} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
