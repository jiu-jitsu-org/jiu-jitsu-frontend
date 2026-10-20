"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { peekRevalidateTarget } from "@/features/community/presentation/dirty-posts";
import { EmptyState } from "@/features/community/presentation/empty-state";
import type { MyActivityTab } from "@/features/community/presentation/my-activity/my-activity-tab";
import { useOpenPostWrite } from "@/features/community/presentation/use-open-post-write";
import {
  closeNativeSubview,
  isNativeBridgeAvailable,
} from "@/shared/lib/native-bridge";

/**
 * 내 커뮤니티 활동 탭별 빈 상태.
 *
 * 쓴 글은 글쓰기 버튼까지 둔다(메인 피드 빈 상태와 같은 진입 — useOpenPostWrite).
 * 저장은 어디서 저장하는지만 알려주고 버튼은 없다.
 * 밸런스 게임은 오늘의 게임이 있는 커뮤니티 홈으로 보낸다(useOpenCommunityHome).
 * 세로 위치는 탭 아래 96(pt-24) — 피드처럼 뷰포트 35%로 내리면 상단 프로필·탭과 멀어진다.
 *
 * 빈 상태에는 목록(CommunityFeedList)이 없어 작성 후 복귀 재조회(useFeedRevalidate)가 돌지 않는다.
 * 그래서 쓴 글 탭은 복귀 시 새 글 기록이 있으면 서버 화면을 다시 그린다 — 다시 그려진 목록이
 * 같은 기록을 이어받아 소비한다(prependNew가 id로 중복을 거른다).
 */
export function MyActivityEmptyState({ tab }: { tab: MyActivityTab }) {
  const openWrite = useOpenPostWrite();
  const openCommunityHome = useOpenCommunityHome();
  useRefreshOnPostCreated(tab === "posts");

  if (tab === "balance") {
    return (
      <EmptyState
        title="아직 참여한 밸런스 게임이 없어요"
        description="투표한 게임은 끝난 뒤에도 여기서 결과를 볼 수 있어요."
        action={{ label: "오늘의 게임 하러 가기", onClick: openCommunityHome }}
        className="pt-24"
      />
    );
  }

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

/**
 * 커뮤니티 홈(오늘의 밸런스 게임이 맨 위에 있는 메인 피드)으로 간다.
 *
 * 앱에서 이 화면은 서브뷰라 닫으면 연 화면으로 돌아간다(뒤로가기와 같은 CLOSE_SUBVIEW). 홈 탭으로
 * 바로 옮기는 브릿지 메시지는 아직 없다. 웹 단독이면 히스토리가 아니라 홈(/)으로 직접 이동한다 —
 * 직전 페이지가 홈이라는 보장이 없다.
 */
function useOpenCommunityHome() {
  const router = useRouter();

  return () => {
    if (isNativeBridgeAvailable()) {
      closeNativeSubview();
      return;
    }
    router.push("/");
  };
}
