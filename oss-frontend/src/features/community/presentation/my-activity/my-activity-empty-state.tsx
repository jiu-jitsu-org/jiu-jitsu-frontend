"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { peekRevalidateTarget } from "@/features/community/presentation/dirty-posts";
import { EmptyState } from "@/features/community/presentation/empty-state";
import type { MyActivityTab } from "@/features/community/presentation/my-activity/my-activity-tab";
import { useOpenPostWrite } from "@/features/community/presentation/use-open-post-write";

/**
 * 내 커뮤니티 활동 탭별 빈 상태.
 *
 * 쓴 글은 글쓰기 버튼까지 둔다(메인 피드 빈 상태와 같은 진입 — useOpenPostWrite).
 * 저장은 어디서 저장하는지만 알려주고 버튼은 없다.
 * 세로 위치는 탭 아래 96(pt-24) — 피드처럼 뷰포트 35%로 내리면 상단 프로필·탭과 멀어진다.
 *
 * 빈 상태에는 목록(CommunityFeedList)이 없어 작성 후 복귀 재조회(useFeedRevalidate)가 돌지 않는다.
 * 그래서 쓴 글 탭은 복귀 시 새 글 기록이 있으면 서버 화면을 다시 그린다 — 다시 그려진 목록이
 * 같은 기록을 이어받아 소비한다(prependNew가 id로 중복을 거른다).
 */
export function MyActivityEmptyState({ tab }: { tab: MyActivityTab }) {
  const openWrite = useOpenPostWrite();
  useRefreshOnPostCreated(tab === "posts");

  if (tab === "saved") {
    return (
      <EmptyState
        title="저장한 글이 없어요"
        description="글 아래 저장 버튼을 누르면 여기에 모여요."
        className="pt-24"
      />
    );
  }

  return (
    <EmptyState
      title="아직 쓴 글이 없어요"
      description="매트 위 첫 이야기를 남겨보세요! 오스!"
      action={{ label: "글쓰기", onClick: openWrite }}
      className="pt-24"
    />
  );
}

/** 작성 화면에서 돌아왔을 때 새 글 기록이 있으면 router.refresh로 첫 페이지를 다시 읽는다. */
function useRefreshOnPostCreated(enabled: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    function refreshIfCreated() {
      if (document.visibilityState !== "visible") return;
      if (peekRevalidateTarget().createdPostId !== null) router.refresh();
    }

    // 앱 서브뷰 닫힘은 visibilitychange, 웹 bfcache 복귀는 pageshow로 온다(useFeedRevalidate와 같은 신호).
    window.addEventListener("pageshow", refreshIfCreated);
    document.addEventListener("visibilitychange", refreshIfCreated);
    return () => {
      window.removeEventListener("pageshow", refreshIfCreated);
      document.removeEventListener("visibilitychange", refreshIfCreated);
    };
  }, [enabled, router]);
}
