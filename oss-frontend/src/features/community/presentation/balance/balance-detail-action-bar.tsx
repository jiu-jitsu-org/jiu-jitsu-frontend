"use client";

import { COMMENT_INPUT_ELEMENT_ID } from "@/features/community/presentation/comment-input-bar";
import { ReactionBarButton } from "@/features/community/presentation/reaction-bar-button";
import { shareCurrentPage } from "@/features/community/presentation/share-current-page";
import { usePostActions } from "@/features/community/presentation/use-post-actions";
import { cn } from "@/shared/lib/cn";
import { useIsExternalBrowser } from "@/shared/lib/native-bridge";
import { CommentIcon, HeartIcon, ShareIcon } from "@/shared/ui/icons";

/**
 * 밸런스 게임 상세 액션바 (클라이언트 leaf).
 *
 * 게시글 상세(PostActionBar)와 **버튼 하나가 다르다** — 저장(북마크)이 없다. 업스트림이
 * 밸런스 컨텐츠의 저장을 지원하지 않아(호출하면 C0008) 그릴 수 없다. 기획 확인 중이라
 * 뒤집히면 버튼 하나를 되살리면 된다.
 *
 * 그 한 칸 때문에 PostActionBar를 재사용하지 못한다(저장이 필수 prop이고 항상 그려진다).
 * 대신 버튼 규격(ReactionBarButton)과 공유 동작(shareCurrentPage)은 공유하므로, 디자인
 * 가이드가 들어오면 두 바가 함께 따라간다.
 *
 * **남은 세 버튼은 게시글 상세와 완전히 같다** — 카운트 규칙, Active/Pressed 색, 아이콘 fill,
 * 외부 브라우저 표시 전용 처리까지 동일하다.
 *
 * 좋아요는 게시글과 **같은 엔드포인트**를 쓴다 — 업스트림 `PUT /board/like/{id}`의 `{id}`가
 * 원래부터 board id가 아니라 contentId라, 밸런스 게임의 contentId를 그대로 넣으면 된다(BE 확인).
 * 그래서 usePostActions를 그대로 쓰되 저장 자리는 쓰지 않는다.
 */
export function BalanceDetailActionBar({
  contentId,
  initialLiked,
  initialLikes,
  comments,
  commented = false,
  className,
}: {
  contentId: number;
  initialLiked: boolean;
  initialLikes: number;
  /** commentCount. 0이면 "댓글쓰기", 1 이상이면 숫자(게시글 상세와 같은 규칙). */
  comments?: number;
  /**
   * 내가 댓글을 남겼는지 — 아이콘을 Active(filled)로 표시한다. 토글 아님.
   *
   * 게시글은 서버가 isCommented로 주지만 밸런스 응답에는 없어 댓글 목록에서 도출한다
   * (get-balance-detail-page-data 참조).
   */
  commented?: boolean;
  className?: string;
}) {
  // 저장은 쓰지 않지만 훅이 한 벌로 관리한다 — 시드만 꺼 두고 토글은 호출하지 않는다.
  const { liked, likes, toggleLike } = usePostActions(contentId, {
    liked: initialLiked,
    bookmarked: false,
    likes: initialLikes,
  });

  // 외부 브라우저(비로그인)에서는 로그인 기반 액션을 표시 전용으로 내린다(#72).
  const externalBrowser = useIsExternalBrowser();

  function focusCommentInput() {
    document.getElementById(COMMENT_INPUT_ELEMENT_ID)?.focus();
  }

  return (
    <div className={cn("flex items-center justify-end gap-2 px-4", className)}>
      {/* 댓글 수는 서버가 준 값을 표시만 하고, Active는 내가 남긴 댓글이 있을 때다(토글 아님). */}
      <ReactionBarButton
        icon={<CommentIcon size={16} filled={commented} />}
        label="댓글쓰기"
        a11yLabel={comments ? `댓글 ${comments}개` : "댓글쓰기"}
        count={comments}
        active={commented}
        activeIconColorClass="text-reaction-bar-detail-active-comment-icon"
        readOnly={externalBrowser}
        onClick={focusCommentInput}
      />
      <ReactionBarButton
        icon={<HeartIcon size={16} filled={liked} />}
        label="좋아요"
        a11yLabel={`좋아요 ${likes}개`}
        count={likes}
        active={liked}
        pressable
        activeIconColorClass="text-reaction-bar-detail-active-like-icon"
        readOnly={externalBrowser}
        onClick={toggleLike}
      />
      {/* 로그인이 필요 없는 유일한 액션이라 외부 브라우저에서도 그대로 활성이다(#72). */}
      <ReactionBarButton
        icon={<ShareIcon size={16} />}
        label="공유하기"
        hideLabel
        onClick={() => void shareCurrentPage()}
      />
    </div>
  );
}
