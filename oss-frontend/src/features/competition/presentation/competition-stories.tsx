"use client";

import { useRouter } from "next/navigation";

import { useOpenPostDetail } from "@/features/community/presentation/use-open-post-detail";
import type { CompetitionStory } from "@/features/competition/domain/competition-story";
import { DetailSection } from "@/features/competition/presentation/competition-detail-sections";
import { cn } from "@/shared/lib/cn";
import {
  isNativeBridgeAvailable,
  openNativeHomeFeed,
  openNativeSubview,
} from "@/shared/lib/native-bridge";
import { ChevronLeftIcon, PeopleIcon } from "@/shared/ui/icons";
import { SURFACE_PRESS } from "@/shared/ui/press-styles";
import { RelativeTime } from "@/shared/ui/relative-time";

/**
 * 대회 이야기 (#366) — 커뮤니티에서 이 대회를 고른 글, 최대 5개(반응 많은 글 2개 먼저, 나머지 최신순).
 *
 * 글을 누르면 게시글 상세가 열린다(피드 카드와 같은 길). 아래 버튼은 글이 있든 없든 전체 피드로 보내고 문구만 다르다 —
 * 없을 때는 "첫 글 남기기"로 커뮤니티에 글을 쓰러 가게 한다.
 */
export function CompetitionStories({
  stories,
}: {
  stories: CompetitionStory[];
}) {
  const openPost = useOpenPostDetail();
  const openFeed = useOpenFeed();
  const empty = stories.length === 0;

  return (
    <DetailSection title="대회 이야기" icon={<PeopleIcon size={20} />}>
      {empty ? (
        <div className="py-4 text-center">
          <p className="text-[15px] leading-[21px] font-semibold text-text-primary">
            아직 이 대회 이야기가 없어요
          </p>
          <p className="mt-1 text-[13px] leading-[18px] text-text-secondary">
            커뮤니티에서 이 대회의 첫 글을 남겨 보세요
          </p>
        </div>
      ) : (
        <ul className="-mx-2 flex flex-col">
          {stories.map((story) => (
            <li key={story.postId}>
              <button
                type="button"
                onClick={() => openPost(story.postId)}
                className={cn(
                  "flex w-full flex-col rounded-10 px-2 py-2.5 text-left",
                  SURFACE_PRESS,
                )}
              >
                <span className="w-full truncate text-[15px] leading-[21px] font-semibold text-text-primary">
                  {story.title}
                </span>
                <span className="mt-0.5 text-[12px] leading-[16px] text-text-tertiary tabular-nums">
                  {story.comments > 0 ? `댓글 ${story.comments} · ` : ""}
                  {story.likes > 0 ? `좋아요 ${story.likes} · ` : ""}
                  <RelativeTime iso={story.createdAt} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={openFeed}
        className={cn(
          "-mx-2 mt-1 flex min-h-11 w-[calc(100%+16px)] items-center justify-center gap-0.5 rounded-10 text-[14px] leading-[20px] font-semibold text-text-secondary",
          SURFACE_PRESS,
        )}
      >
        {empty ? "커뮤니티에서 첫 글 남기기" : "커뮤니티에서 더 보기"}
        <ChevronLeftIcon size={16} className="rotate-180" />
      </button>
    </DetailSection>
  );
}

/**
 * 전체 피드로 가기. 앱은 홈 탭으로 바꿔 달라고 하고(새 앱), 그 신호를 모르는 앱은 피드를 서브뷰로 연다.
 * 웹 단독은 홈(피드)으로 이동한다.
 */
function useOpenFeed() {
  const router = useRouter();
  return () => {
    if (isNativeBridgeAvailable()) {
      if (!openNativeHomeFeed()) openNativeSubview(`${window.location.origin}/`);
      return;
    }
    router.push("/");
  };
}
