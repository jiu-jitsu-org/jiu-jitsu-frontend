"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useOpenPostDetail } from "@/features/community/presentation/use-open-post-detail";
import { useOpenPostWrite } from "@/features/community/presentation/use-open-post-write";
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
 * 대회 이야기 (#366) — 커뮤니티에서 이 대회를 고른 글, 서버가 고른 최대 5개를 서버 순서대로(#421).
 *
 * 글을 누르면 게시글 상세가 열린다(피드 카드와 같은 길). 글이 있으면 아래 버튼은 전체 피드로 보낸다.
 * 없으면 "첫 글 남기기"가 글쓰기를 연다 — '대회' 카테고리와 이 대회가 미리 골라져 있다(#433, 피드 글쓰기와 같은 길:
 * 비로그인은 로그인 안내, 앱은 서브뷰, 웹은 이동). 글을 올리고 상세로 돌아오면 상세가 다시 읽어 새 글이 보인다.
 */
export function CompetitionStories({
  competitionId,
  stories,
}: {
  competitionId: number;
  stories: CompetitionStory[];
}) {
  const openPost = useOpenPostDetail();
  const openFeed = useOpenFeed();
  const openPostWrite = useOpenPostWrite({ competitionId });
  const openWrite = () => {
    markWriteOpened();
    openPostWrite();
  };
  useRefreshAfterWrite();
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
        onClick={empty ? openWrite : openFeed}
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

/** 이 상세에서 글쓰기를 열었는지 — 돌아왔을 때 대회 이야기를 다시 읽을지 정한다(#433). */
const WRITE_OPENED_KEY = "oss.competition.write-opened";

function markWriteOpened() {
  try {
    window.sessionStorage.setItem(WRITE_OPENED_KEY, "1");
  } catch {
    // 저장소를 못 쓰면 돌아와도 다시 읽지 않는다 — 새 글은 다음에 상세를 열 때 보인다.
  }
}

function takeWriteOpened(): boolean {
  try {
    if (!window.sessionStorage.getItem(WRITE_OPENED_KEY)) return false;
    window.sessionStorage.removeItem(WRITE_OPENED_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * 글쓰기에서 돌아오면 상세를 다시 읽는다 — 올린 글이 대회 이야기에 바로 보이게(#433).
 * 앱은 작성 서브뷰가 닫히면 상세 웹뷰가 다시 보이며 visibilitychange가 오고, 웹은 뒤로 가기로 상세가 다시 그려질 때
 * (마운트·pageshow) 확인한다. 목록의 상세 복귀 갱신(useRefreshAfterDetail)과 같은 방식이다.
 */
function useRefreshAfterWrite() {
  const router = useRouter();
  useEffect(() => {
    const refreshIfReturned = () => {
      if (document.visibilityState !== "visible") return;
      if (takeWriteOpened()) router.refresh();
    };
    refreshIfReturned();
    document.addEventListener("visibilitychange", refreshIfReturned);
    window.addEventListener("pageshow", refreshIfReturned);
    return () => {
      document.removeEventListener("visibilitychange", refreshIfReturned);
      window.removeEventListener("pageshow", refreshIfReturned);
    };
  }, [router]);
}
