"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { clearPostCreated } from "@/features/community/presentation/dirty-posts";
import { useOpenPostDetail } from "@/features/community/presentation/use-open-post-detail";
import { useOpenPostWrite } from "@/features/community/presentation/use-open-post-write";
import type {
  CompetitionStory,
  CompetitionStoryList,
} from "@/features/competition/domain/competition-story";
import { DetailSection } from "@/features/competition/presentation/competition-detail-sections";
import { entryPath, track } from "@/shared/lib/analytics";
import { cn } from "@/shared/lib/cn";
import {
  isNativeBridgeAvailable,
  openNativeHomeFeed,
  openNativeSubview,
} from "@/shared/lib/native-bridge";
import { Button } from "@/shared/ui/button";
import { ChevronLeftIcon, PeopleIcon } from "@/shared/ui/icons";
import { SURFACE_PRESS } from "@/shared/ui/press-styles";
import { RelativeTime } from "@/shared/ui/relative-time";

/** 대회 이야기 구역 id — 위 요약 줄의 '이야기 N'이 여기로 내려온다(#597). */
const STORIES_SECTION_ID = "competition-stories";

/**
 * 대회 이야기 (#366 · #597) — 커뮤니티에서 이 대회를 고른 글.
 *
 * 위에서부터: 묻기(글이 있든 없든 늘) → 최신 글 최대 5개 → '커뮤니티에서 N개 모두 보기'.
 * - 묻기: 대회 전엔 질문, 끝난 뒤엔 후기로 이끈다. 아래 줄에 글이 커뮤니티 '대회' 카테고리에 올라간다고 미리 알린다.
 *   누르면 글쓰기가 '대회' 카테고리와 이 대회를 고른 채 열린다(#433 · #588, 피드 글쓰기와 같은 길: 비로그인은 로그인 안내,
 *   앱은 서브뷰, 웹은 이동). 내용은 선택이라(#589) 제목만으로도 올라간다.
 * - 글을 누르면 게시글 상세(피드 카드와 같은 길). 줄마다 닉네임 · 시간 · 댓글 수.
 * - 모두 보기: 홈 피드 '대회' 탭을 이 대회 글만으로 연다(#598 · jiu-jitsu-ios#437).
 * 글을 올리고 상세로 돌아오면 상세가 다시 읽어 새 글과 수가 보인다.
 */
export function CompetitionStories({
  competitionId,
  list,
  ended,
}: {
  competitionId: number;
  list: CompetitionStoryList;
  /** 끝난 대회인지 — 묻기 문구를 질문 대신 후기로 바꾼다. */
  ended: boolean;
}) {
  const { totalCount, stories } = list;
  const openPost = useOpenPostDetail("competition_story");
  const openFeed = useOpenCompetitionFeed(competitionId);
  const openPostWrite = useOpenPostWrite({
    competitionId,
    from: "competition_story_ask",
  });
  const openWrite = () => {
    markWriteOpened(competitionId);
    openPostWrite();
  };
  useRefreshAfterWrite(competitionId);

  return (
    <DetailSection
      id={STORIES_SECTION_ID}
      title="대회 이야기"
      icon={<PeopleIcon size={20} />}
      count={totalCount > 0 ? totalCount : undefined}
      // 위 요약 줄에서 내려올 때 붙어 있는 앱바(44) 아래에 제목이 오게.
      className="scroll-mt-[calc(var(--safe-area-top)+44px)]"
    >
      <div className="flex items-center gap-3 py-1">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] leading-[21px] font-semibold break-keep text-text-primary">
            {ended ? "대회 후기를 남겨 주세요" : "궁금한 걸 물어보세요"}
          </p>
          <p className="mt-0.5 text-[13px] leading-[18px] break-keep text-text-secondary">
            커뮤니티 &lsquo;대회&rsquo; 카테고리에 올라가요
          </p>
        </div>
        <Button variant="tint" size="s" onClick={openWrite}>
          {ended ? "후기 쓰기" : "질문하기"}
        </Button>
      </div>
      {stories.length > 0 ? (
        <>
          <ul className="-mx-2 mt-2 flex flex-col">
            {stories.map((story) => (
              <li key={story.postId}>
                <StoryRow
                  story={story}
                  onPress={() => openPost(story.postId)}
                />
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => openFeed(totalCount)}
            className={cn(
              "-mx-2 mt-1 flex min-h-11 w-[calc(100%+16px)] items-center justify-center gap-0.5 rounded-10 text-[14px] leading-[20px] font-semibold text-text-secondary tabular-nums",
              SURFACE_PRESS,
            )}
          >
            커뮤니티에서 {totalCount.toLocaleString("ko-KR")}개 모두 보기
            <ChevronLeftIcon size={16} className="rotate-180" />
          </button>
        </>
      ) : null}
    </DetailSection>
  );
}

/** 글 한 줄 — 제목, 아래에 닉네임 · 시간 · 댓글 수. */
function StoryRow({
  story,
  onPress,
}: {
  story: CompetitionStory;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={cn(
        "flex w-full flex-col rounded-10 px-2 py-2.5 text-left",
        SURFACE_PRESS,
      )}
    >
      <span className="w-full truncate text-[15px] leading-[21px] font-semibold text-text-primary">
        {story.title}
      </span>
      <span className="mt-0.5 flex w-full min-w-0 text-[12px] leading-[16px] text-text-tertiary tabular-nums">
        {story.author ? (
          <span className="min-w-0 truncate">{story.author} ·&nbsp;</span>
        ) : null}
        <span className="shrink-0 whitespace-pre">
          <RelativeTime iso={story.createdAt} />
          {` · 댓글 ${story.comments.toLocaleString("ko-KR")}`}
        </span>
      </span>
    </button>
  );
}

/** 위 요약 줄의 '이야기 N' — 대회 이야기 구역으로 내려간다. 동작 줄이기 설정이면 바로 옮긴다. */
export function scrollToCompetitionStories() {
  const section = document.getElementById(STORIES_SECTION_ID);
  if (!section) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  section.scrollIntoView({
    behavior: reduce ? "auto" : "smooth",
    block: "start",
  });
}

/**
 * '모두 보기' — 홈 피드 '대회' 탭을 이 대회 글만으로 연다(#598). 웹은 `/?competitionId=`로 이동하고,
 * 앱은 홈 탭으로 바꿔 달라며 대회 번호를 함께 보낸다(jiu-jitsu-ios#437 — 번호를 모르는 앱은 지금처럼 피드만).
 * 그 신호를 모르는 더 옛 앱은 같은 주소를 서브뷰로 연다.
 */
function useOpenCompetitionFeed(competitionId: number) {
  const router = useRouter();
  return (totalCount: number) => {
    track("competition_story_more", {
      competition_id: competitionId,
      story_count: totalCount,
    });
    const path = entryPath(
      `/?competitionId=${competitionId}`,
      "competition_story",
    );
    if (isNativeBridgeAvailable()) {
      if (!openNativeHomeFeed({ competitionId }))
        openNativeSubview(`${window.location.origin}${path}`);
      return;
    }
    router.push(path);
  };
}

/**
 * 어느 대회 상세에서 글쓰기를 열었는지 — 돌아왔을 때 대회 이야기를 다시 읽을지 정한다(#433).
 * 대회 id를 값으로 남겨, 다른 대회 상세가 이 표시를 가져가 헛되이 다시 읽지 않게 한다.
 */
const WRITE_OPENED_KEY = "oss.competition.write-opened";

function markWriteOpened(competitionId: number) {
  try {
    window.sessionStorage.setItem(WRITE_OPENED_KEY, String(competitionId));
  } catch {
    // 저장소를 못 쓰면 돌아와도 다시 읽지 않는다 — 새 글은 다음에 상세를 열 때 보인다.
  }
}

function takeWriteOpened(competitionId: number): boolean {
  try {
    if (
      window.sessionStorage.getItem(WRITE_OPENED_KEY) !== String(competitionId)
    ) {
      return false;
    }
    window.sessionStorage.removeItem(WRITE_OPENED_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * 글쓰기에서 돌아오면 상세를 다시 읽는다 — 올린 글이 대회 이야기 · 이야기 수에 바로 보이게(#433 · #597).
 * 앱은 작성 서브뷰가 닫히면 상세 웹뷰가 다시 보이며 visibilitychange가 오고, 웹은 뒤로 가기로 상세가 다시 그려질 때
 * (마운트·pageshow) 확인한다. 목록의 상세 복귀 갱신(useRefreshAfterDetail)과 같은 방식이다.
 */
function useRefreshAfterWrite(competitionId: number) {
  const router = useRouter();
  useEffect(() => {
    const refreshIfReturned = () => {
      if (document.visibilityState !== "visible") return;
      if (!takeWriteOpened(competitionId)) return;
      // 새 글은 여기서 다시 읽어 보여 준다. 홈 피드용 등록 표시는 지운다 — 남으면 나중에 홈 피드가
      // 이 글 때문에 읽던 자리에서 최상단으로 튄다(#485).
      clearPostCreated();
      router.refresh();
    };
    refreshIfReturned();
    document.addEventListener("visibilitychange", refreshIfReturned);
    window.addEventListener("pageshow", refreshIfReturned);
    return () => {
      document.removeEventListener("visibilitychange", refreshIfReturned);
      window.removeEventListener("pageshow", refreshIfReturned);
    };
  }, [competitionId, router]);
}
