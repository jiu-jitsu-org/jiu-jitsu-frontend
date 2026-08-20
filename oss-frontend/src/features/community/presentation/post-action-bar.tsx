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
 * 배치: 태그 아래(디바이더 없음), 우측 정렬. 좌우 16(px-4). 버튼 간격 8(gap-2).
 * 버튼 공통: 배경 reaction-bar/detail/default/bg / 높이 28 / radius 10 / 좌우 패딩 8 / 아이콘 16.
 * 텍스트는 Body S(14/21) + reaction-bar/detail/default/count-text, 아이콘은 같은 계열 icon 토큰.
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
  shares,
  className,
}: {
  postId: number;
  initialLiked: boolean;
  initialBookmarked: boolean;
  initialLikes: number;
  initialSaves?: number;
  /** 공유 수. 상세 응답에 아직 없어 optional — 없거나 0이면 숫자를 숨긴다. */
  shares?: number;
  className?: string;
}) {
  const { liked, bookmarked, likes, saves, toggleLike, toggleBookmark } =
    usePostActions(postId, {
      liked: initialLiked,
      bookmarked: initialBookmarked,
      likes: initialLikes,
      saves: initialSaves,
    });

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
        count={likes}
        a11yLabel={`좋아요 ${likes}개`}
        active={liked}
        activeColorClass="text-reaction-bar-detail-active-like-icon"
        onClick={toggleLike}
      />
      <ActionButton
        icon={<BookmarkIcon size={16} filled={bookmarked} />}
        label="북마크"
        count={saves}
        a11yLabel={`북마크 ${saves}개`}
        hideLabel
        active={bookmarked}
        activeColorClass="text-reaction-bar-detail-active-bookmark-icon"
        onClick={toggleBookmark}
      />
      <ActionButton
        icon={<ShareIcon size={16} />}
        label="공유하기"
        count={shares}
        hideLabel
        onClick={() => void share()}
      />
    </div>
  );
}

/**
 * 액션바 단일 버튼.
 *
 * 배경 reaction-bar/detail/default/bg, 높이 28(h-7), radius 10, 좌우 패딩 8(px-2).
 * 텍스트 Body S(14/21) — 피드 카드 ReactionButton과 동일.
 *
 * 표시 우선순위: count가 1 이상이면 숫자 → 아니면 label(hideLabel이면 아이콘만).
 * 활성(좋아요/북마크 active) 케이스: 별도 디자인이 없어 임의 정의 — 아이콘 filled(호출부에서 전달) +
 * 활성 색상 토큰(activeColorClass)으로 표시한다(하드코딩 색 미사용). 배경은 동일하게 유지.
 */
function ActionButton({
  icon,
  label,
  a11yLabel,
  count,
  hideLabel = false,
  active,
  activeColorClass,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  /** 스크린리더용 라벨. 없으면 label을 쓴다(숫자만 보이는 버튼의 의미를 잃지 않게). */
  a11yLabel?: string;
  count?: number;
  /** 카운트가 없을 때 텍스트 없이 아이콘만 둘지 — 북마크·공유가 여기 해당. */
  hideLabel?: boolean;
  active?: boolean;
  activeColorClass?: string;
  onClick?: () => void;
}) {
  const showCount = typeof count === "number" && count > 0;
  const text = showCount ? String(count) : hideLabel ? null : label;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={a11yLabel ?? label}
      aria-pressed={activeColorClass ? active : undefined}
      className={cn(
        "inline-flex h-7 items-center rounded-[10px] bg-reaction-bar-detail-default-bg px-2",
        text !== null && "gap-1",
      )}
    >
      <span
        className={cn(
          "text-reaction-bar-detail-default-icon",
          active && activeColorClass,
        )}
      >
        {icon}
      </span>
      {text !== null ? (
        <span
          className={cn(
            "text-sm leading-[21px] text-reaction-bar-detail-default-count-text",
            active && "text-reaction-bar-detail-active-count-text",
          )}
        >
          {text}
        </span>
      ) : null}
    </button>
  );
}
