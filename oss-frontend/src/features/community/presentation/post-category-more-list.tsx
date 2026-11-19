"use client";

import { useOpenPostDetail } from "@/features/community/presentation/use-open-post-detail";
import { cn } from "@/shared/lib/cn";
import { Divider } from "@/shared/ui/divider";
import { SURFACE_PRESS } from "@/shared/ui/press-styles";
import { RelativeTime } from "@/shared/ui/relative-time";

export type CategoryMorePost = {
  id: number;
  title: string;
  comments: number;
  /** 글을 올린 때(ISO 8601). */
  createdAt: string;
};

/**
 * "○○의 다른 글" 목록(#594) — 줄을 누르면 그 글 상세가 열린다(피드 카드와 같은 길, 앱은 새 서브뷰).
 *
 * 댓글과는 본문↔댓글과 같은 4px 띠(Divider)로 나눈다 — 선 대신 면으로 나누는 큰 덩어리 구분.
 * 줄 모양은 대회 상세 "대회 이야기"와 같다: 제목 한 줄 + 아래 보조 한 줄(댓글 수 · 시간), 누르면 바탕이 옅게 물든다.
 * 댓글이 없으면 대회 이야기처럼 댓글 수를 빼고 시간만 둔다.
 * 글자는 댓글 목록과 같은 토큰을 쓴다 — 제목은 글 상세 제목(Body M), 보조 줄은 댓글 날짜(Label M).
 */
export function PostCategoryMoreList({
  title,
  posts,
}: {
  title: string;
  posts: CategoryMorePost[];
}) {
  const openPost = useOpenPostDetail();

  return (
    <>
      {/* 댓글 끝 ↔ 띠 24 = 댓글 목록 하단 여백 16 + 8 — 액션바 ↔ 띠(mt-6)와 같은 간격. */}
      <Divider className="mt-2" />
      <section className="px-4 pb-6 pt-6">
        <h2 className="text-title-3 text-text-primary">{title}</h2>
        {/* 줄 눌림 면이 글자보다 8 넓게 깔리도록 -mx-2 + px-2 — 글자는 제목과 같은 세로선에 선다. */}
        <ul className="-mx-2 mt-2 flex flex-col">
          {posts.map((post) => (
            <li key={post.id}>
              <button
                type="button"
                onClick={() => openPost(post.id)}
                className={cn(
                  "flex w-full flex-col rounded-10 px-2 py-2.5 text-left",
                  SURFACE_PRESS,
                )}
              >
                <span className="w-full truncate text-body-m text-feed-card-body-title-text">
                  {post.title}
                </span>
                <span className="mt-0.5 text-label-m text-feed-card-header-date-text tabular-nums">
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
