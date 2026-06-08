"use client";

import { COMMENT_INPUT_ELEMENT_ID } from "@/features/community/presentation/comment-input-bar";
import { usePostActions } from "@/features/community/presentation/use-post-actions";
import { cn } from "@/shared/lib/cn";
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
 * 좋아요/북마크는 usePostActions로 낙관적 토글한다(활성은 아이콘 filled로 표시).
 *
 * 배치: 태그 아래(디바이더 없음), 우측 정렬. 좌우 16(px-4).
 * 버튼 공통: 배경 cool-gray-25 / 높이 28 / radius 10 / 좌우 패딩 8 / 아이콘 16 / 수직 가운데.
 * 아이콘 색은 reaction-bar/default/icon으로 통일, 텍스트는 reaction-bar/default/count-text(Body S).
 */
export function PostActionBar({
  postId,
  initialLiked,
  initialBookmarked,
  initialLikes,
  className,
}: {
  postId: number;
  initialLiked: boolean;
  initialBookmarked: boolean;
  initialLikes: number;
  className?: string;
}) {
  const { liked, bookmarked, toggleLike, toggleBookmark } = usePostActions(
    postId,
    {
      liked: initialLiked,
      bookmarked: initialBookmarked,
      likes: initialLikes,
    },
  );

  function focusCommentInput() {
    document.getElementById(COMMENT_INPUT_ELEMENT_ID)?.focus();
  }

  /**
   * Web Share API 우선, 미지원 시 링크 복사 fallback.
   * FIXME: 네이티브 공유 시트 연동(SHARE_* 브릿지 메시지)은 메시지 계약 정의 후 추가.
   */
  async function share() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ url });
      } catch {
        // 사용자가 공유 시트를 닫은 경우 등 — 무시.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // 클립보드 접근 실패 — 조용히 무시.
    }
  }

  return (
    <div className={cn("flex items-center justify-end gap-2 px-4", className)}>
      <ActionButton
        icon={<CommentIcon size={16} />}
        label="댓글쓰기"
        onClick={focusCommentInput}
      />
      <ActionButton
        icon={<HeartIcon size={16} filled={liked} />}
        label="좋아요"
        active={liked}
        activeColorClass="text-reaction-bar-active-like-icon"
        onClick={toggleLike}
      />
      <ActionButton
        icon={<BookmarkIcon size={16} filled={bookmarked} />}
        label="북마크"
        active={bookmarked}
        activeColorClass="text-reaction-bar-active-bookmark-icon"
        onClick={toggleBookmark}
        iconOnly
      />
      <ActionButton
        icon={<ShareIcon size={16} />}
        label="공유하기"
        onClick={() => void share()}
        iconOnly
      />
    </div>
  );
}

/**
 * 액션바 단일 버튼.
 *
 * 배경 cool-gray-25(primitive → arbitrary value), 높이 28(h-7), radius 10, 좌우 패딩 8(px-2).
 * 아이콘 색 reaction-bar/default/icon으로 통일, 텍스트 Body S(14/21) + reaction-bar/default/count-text.
 *
 * 활성(좋아요/북마크 active) 케이스: 별도 디자인이 없어 임의 정의 — 아이콘 filled(호출부에서 전달) +
 * 활성 색상 토큰(activeColorClass)으로 표시한다(하드코딩 색 미사용). 배경은 동일하게 유지.
 */
function ActionButton({
  icon,
  label,
  active,
  activeColorClass,
  onClick,
  iconOnly = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  activeColorClass?: string;
  onClick?: () => void;
  iconOnly?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "inline-flex h-7 items-center rounded-[10px] bg-[var(--cool-gray-25)] px-2",
        !iconOnly && "gap-1",
      )}
    >
      <span className={cn("text-reaction-bar-default-icon", active && activeColorClass)}>
        {icon}
      </span>
      {!iconOnly ? (
        <span className="text-sm leading-[21px] text-reaction-bar-default-count-text">
          {label}
        </span>
      ) : null}
    </button>
  );
}
