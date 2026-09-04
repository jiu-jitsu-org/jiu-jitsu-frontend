"use client";

import { COMMENT_INPUT_ELEMENT_ID } from "@/features/community/presentation/comment-input-bar";
import { ReactionBarButton } from "@/features/community/presentation/reaction-bar-button";
import { shareCurrentPage } from "@/features/community/presentation/share-current-page";
import { usePostActions } from "@/features/community/presentation/use-post-actions";
import { cn } from "@/shared/lib/cn";
import { useIsExternalBrowser } from "@/shared/lib/native-bridge";
import {
  BookmarkIcon,
  CommentIcon,
  HeartIcon,
  ShareIcon,
} from "@/shared/ui/icons";

/**
 * 상세 화면 액션바 (클라이언트 leaf).
 *
 * 댓글쓰기·공유가 추가되어 FeedCardReactions와 구성이 다르므로 별도 컴포넌트로 둔다.
 * 좋아요/북마크는 usePostActions로 낙관적 토글하고, 댓글은 서버가 준 상태를 표시만 한다.
 * 공유는 카운트도 상태도 두지 않는다(정책) — 아이콘 탭으로 공유 시트를 여는 것이 전부다.
 * 시트를 여는 순서와 이유는 shareCurrentPage 참고(밸런스 게임 상세와 공용).
 *
 * 배치: 태그 아래(디바이더 없음), 우측 정렬. 좌우 16(px-4). 버튼 간격 8(gap-2).
 * 버튼 공통: 높이 28 고정 / radius 10 / 아이콘 16 / 아이콘↔텍스트 4 / 배경과의 좌우 마진 8.
 *
 * 색상은 상세 전용 reaction-bar/detail 패밀리를 쓴다(피드 카드용 reaction-bar/* 는 배경 토큰이
 * 없고 한 단계 연한 색이라 상세 바에는 맞지 않는다):
 * - Default : bg reaction-bar/detail/default/bg · icon .../icon · text .../count-text
 * - Pressed : bg reaction-bar/detail/pressed/bg · icon .../icon · text .../count-text
 * - Active  : 배경은 Default 유지, 아이콘은 filled + 종류별 active 토큰, 텍스트는 active/count-text
 *
 * 라벨/카운트 규칙(디자인 기본형 기준): 카운트가 0이거나 API에 없으면 라벨(없으면 아이콘만),
 * 1 이상이면 숫자를 노출한다. 서버가 내려주는 값만 쓰고 없는 값을 임의로 만들지 않는다.
 */
export function PostActionBar({
  postId,
  initialLiked,
  initialBookmarked,
  initialLikes,
  initialSaves,
  comments,
  commented = false,
  className,
}: {
  postId: number;
  initialLiked: boolean;
  initialBookmarked: boolean;
  initialLikes: number;
  initialSaves?: number;
  /**
   * commentCount. 다른 버튼과 같은 규칙 — 0이면 "댓글쓰기", 1 이상이면 숫자.
   * 낙관적 상태가 아니라 서버 렌더 값이다(댓글 등록 후 router.refresh로 갱신).
   */
  comments?: number;
  /** isCommented — 내가 댓글을 남긴 글이면 댓글 아이콘을 Active(filled)로 표시. 토글 아님. */
  commented?: boolean;
  className?: string;
}) {
  const { liked, bookmarked, likes, saves, toggleLike, toggleBookmark } =
    usePostActions(postId, {
      liked: initialLiked,
      bookmarked: initialBookmarked,
      likes: initialLikes,
      saves: initialSaves,
    });

  // 외부 브라우저(비로그인)에서는 로그인 기반 액션을 표시 전용으로 내린다(#72).
  const externalBrowser = useIsExternalBrowser();

  function focusCommentInput() {
    document.getElementById(COMMENT_INPUT_ELEMENT_ID)?.focus();
  }

  return (
    <div className={cn("flex items-center justify-end gap-2 px-4", className)}>
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
      <ReactionBarButton
        icon={<BookmarkIcon size={16} filled={bookmarked} />}
        label="북마크"
        a11yLabel={`북마크 ${saves}개`}
        count={saves}
        hideLabel
        active={bookmarked}
        pressable
        activeIconColorClass="text-reaction-bar-detail-active-bookmark-icon"
        readOnly={externalBrowser}
        onClick={toggleBookmark}
      />
      {/* 공유는 카운트도 Active 표시도 없다 — 공유 수·공유 기록을 두지 않기로 확정된 정책.
          로그인이 필요 없는 유일한 액션이라 외부 브라우저에서도 그대로 활성이다(#72). */}
      <ReactionBarButton
        icon={<ShareIcon size={16} />}
        label="공유하기"
        hideLabel
        onClick={() => void shareCurrentPage()}
      />
    </div>
  );
}
