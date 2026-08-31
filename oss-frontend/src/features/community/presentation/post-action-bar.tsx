"use client";

import { COMMENT_INPUT_ELEMENT_ID } from "@/features/community/presentation/comment-input-bar";
import { usePostActions } from "@/features/community/presentation/use-post-actions";
import { cn } from "@/shared/lib/cn";
import {
  isNativeBridgeAvailable,
  showNativeShareSheet,
  useIsExternalBrowser,
} from "@/shared/lib/native-bridge";
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
 * 시트 자체는 navigator.share(엔진이 OS 시트를 띄운다)가 1순위고, 이를 지원하지 않는 웹뷰에서만
 * 네이티브 브릿지에 위임한다 — 자세한 순서와 이유는 아래 share() 참고.
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

  /**
   * 공유 시트 열기 — navigator.share → 네이티브 브릿지 → 링크 복사 순.
   *
   * navigator.share를 맨 앞에 두는 이유: 이 API는 웹이 그린 UI가 아니라 엔진이 OS 공유 시트를
   * 직접 present 한다. iOS 웹뷰(WKWebView)가 이를 구현하고 있어 앱 안에서도 이미 네이티브
   * 시트가 뜬다 — 무조건 브릿지로 보내면 iOS가 SHOW_SHARE_SHEET를 구현·배포하기 전까지
   * 공유가 무반응이 된다(회신 없는 단방향이라 웹이 실패를 감지해 되돌릴 수도 없다).
   *
   * 브릿지는 navigator.share가 없는 웹뷰(Android WebView)를 위한 경로다. 앱이 공유 항목·
   * 제외 액티비티를 직접 소유해야 할 때가 오면 이 순서만 뒤집으면 된다.
   *
   * 공유 URL은 현재 상세의 절대 URL을 환경별 origin 그대로 쓰되 쿼리(정렬 등)·해시는 뗀다.
   * 열람 맥락일 뿐 공유받는 사람에게는 의미가 없기 때문. (포함 여부는 이슈에서 보류 상태)
   */
  async function share() {
    const url = `${window.location.origin}${window.location.pathname}`;

    if (navigator.share) {
      try {
        await navigator.share({ url });
      } catch {
        // 사용자가 공유 시트를 닫은 경우 등 — 무시.
      }
      return;
    }

    if (isNativeBridgeAvailable()) {
      showNativeShareSheet(url);
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
        a11yLabel={comments ? `댓글 ${comments}개` : "댓글쓰기"}
        count={comments}
        active={commented}
        activeIconColorClass="text-reaction-bar-detail-active-comment-icon"
        readOnly={externalBrowser}
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
        readOnly={externalBrowser}
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
        readOnly={externalBrowser}
        onClick={toggleBookmark}
      />
      {/* 공유는 카운트도 Active 표시도 없다 — 공유 수·공유 기록을 두지 않기로 확정된 정책.
          로그인이 필요 없는 유일한 액션이라 외부 브라우저에서도 그대로 활성이다(#72). */}
      <ActionButton
        icon={<ShareIcon size={16} />}
        label="공유하기"
        hideLabel
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
  readOnly = false,
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
  /**
   * 누를 수 없는 표시 전용인지 — 외부 브라우저(비로그인)에서 로그인 기반 액션에 쓴다(#72).
   * 카운트는 콘텐츠의 일부라 남기고, 탭 대상만 없앤다.
   */
  readOnly?: boolean;
  activeIconColorClass?: string;
  onClick?: () => void;
}) {
  const showCount = typeof count === "number" && count > 0;
  const text = showCount ? String(count) : hideLabel ? null : label;

  // 표시 전용: 탭 대상을 없애되 카운트는 남긴다. 아이콘+숫자를 하나의 의미 단위로 읽히게
  // role="img" + aria-label로 묶는다(span의 aria-label은 role 없이는 무시될 수 있다).
  //
  // 배경은 Default를 그대로 쓴다 — reaction-bar/detail에 disabled 배경 토큰이 없다.
  // 아이콘·텍스트만 detail/disabled로 내린다(상세 바는 detail 패밀리를 쓴다는 이 파일의 규칙).
  if (readOnly) {
    return (
      <span
        role="img"
        aria-label={a11yLabel ?? label}
        className={cn(
          "inline-flex h-7 items-center rounded-[10px] bg-reaction-bar-detail-default-bg px-2",
          text !== null && "gap-1",
        )}
      >
        <span className="text-reaction-bar-detail-disabled-icon">{icon}</span>
        {text !== null ? (
          <span className="text-body-s text-reaction-bar-detail-disabled-count-text">
            {text}
          </span>
        ) : null}
      </span>
    );
  }

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
            "text-body-s",
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
