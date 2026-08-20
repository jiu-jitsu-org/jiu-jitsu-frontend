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
 * 좋아요/북마크는 usePostActions로 낙관적 토글하고, 댓글·공유는 서버가 준 상태를 표시만 한다.
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
  commented = false,
  shared = false,
  shares,
  className,
}: {
  postId: number;
  initialLiked: boolean;
  initialBookmarked: boolean;
  initialLikes: number;
  initialSaves?: number;
  /** isCommented — 내가 댓글을 남긴 글이면 댓글 아이콘을 Active(filled)로 표시. 토글 아님. */
  commented?: boolean;
  /** isShared — 서버가 아직 안 내려주면 false로 들어와 Active가 꺼진다. 토글 아님. */
  shared?: boolean;
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
        icon={<CommentIcon size={16} filled={commented} />}
        label="댓글쓰기"
        active={commented}
        activeIconColorClass="text-reaction-bar-detail-active-comment-icon"
        onClick={focusCommentInput}
      />
      <ActionButton
        icon={<HeartIcon size={16} filled={liked} />}
        label="좋아요"
        a11yLabel={`좋아요 ${likes}개`}
        count={likes}
        active={liked}
        pressable
        activeIconColorClass="text-reaction-bar-detail-active-like-icon"
        onClick={toggleLike}
      />
      <ActionButton
        icon={<BookmarkIcon size={16} filled={bookmarked} />}
        label="북마크"
        a11yLabel={`북마크 ${saves}개`}
        count={saves}
        hideLabel
        active={bookmarked}
        pressable
        activeIconColorClass="text-reaction-bar-detail-active-bookmark-icon"
        onClick={toggleBookmark}
      />
      <ActionButton
        icon={<ShareIcon size={16} />}
        label="공유하기"
        count={shares}
        hideLabel
        active={shared}
        // 공유 Active는 디자인상 북마크와 같은 색 토큰을 쓴다(전용 토큰 없음).
        activeIconColorClass="text-reaction-bar-detail-active-bookmark-icon"
        onClick={() => void share()}
      />
    </div>
  );
}

/**
 * 액션바 단일 버튼.
 *
 * 높이 28(h-7), radius 10, 좌우 패딩 8(px-2), 아이콘↔텍스트 4(gap-1).
 * 텍스트 Body S(14/21).
 *
 * 표시 우선순위: count가 1 이상이면 숫자 → 아니면 label(hideLabel이면 아이콘만).
 * 상태 우선순위: Pressed(:active) > Active > Default. Tailwind가 variant 유틸리티를 base 뒤에
 * 배치하므로 pressed 클래스가 Active 색을 덮어쓴다.
 */
function ActionButton({
  icon,
  label,
  a11yLabel,
  count,
  hideLabel = false,
  active = false,
  pressable = false,
  activeIconColorClass,
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
  /** 토글 버튼인지 — aria-pressed를 붙일지 결정한다(댓글쓰기·공유는 토글이 아니다). */
  pressable?: boolean;
  activeIconColorClass?: string;
  onClick?: () => void;
}) {
  const showCount = typeof count === "number" && count > 0;
  const text = showCount ? String(count) : hideLabel ? null : label;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={a11yLabel ?? label}
      aria-pressed={pressable ? active : undefined}
      className={cn(
        // group: :active는 눌린 요소와 조상에만 매칭돼 자식 span이 안 걸린다 → group-active로 전달.
        "group inline-flex h-7 items-center rounded-[10px] px-2",
        // Active는 배경을 Default 그대로 두고, 눌린 동안에만 pressed 배경으로 바뀐다.
        "bg-reaction-bar-detail-default-bg active:bg-reaction-bar-detail-pressed-bg",
        text !== null && "gap-1",
      )}
    >
      <span
        className={cn(
          "text-reaction-bar-detail-default-icon group-active:text-reaction-bar-detail-pressed-icon",
          active && activeIconColorClass,
        )}
      >
        {icon}
      </span>
      {text !== null ? (
        <span
          className={cn(
            "text-sm leading-[21px]",
            "text-reaction-bar-detail-default-count-text group-active:text-reaction-bar-detail-pressed-count-text",
            active && "text-reaction-bar-detail-active-count-text",
          )}
        >
          {text}
        </span>
      ) : null}
    </button>
  );
}
