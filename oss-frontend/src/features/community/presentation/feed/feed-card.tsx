"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

import { cn } from "@/shared/lib/cn";
import {
  BookmarkIcon,
  CommentIcon,
  HeartIcon,
  MoreVerticalIcon,
  PersonIcon,
} from "@/shared/ui/icons";

// 본문 말줄임 줄 수는 Tailwind 정적 클래스 `line-clamp-3`이 단일 출처다.
// (Tailwind는 동적 클래스명을 감지하지 못하므로 상수 보간 대신 클래스로 고정)

export type FeedAuthor = {
  name: string;
  /** 프로필 이미지 URL. 없으면 빈 원 플레이스홀더. */
  avatarUrl?: string;
};

export type FeedImage = {
  url: string;
  /** 대체 텍스트(접근성). 장식이면 빈 문자열. */
  alt?: string;
  /** 원본 픽셀 크기. 있으면 CLS(레이아웃 시프트) 예방에 사용. */
  width?: number;
  height?: number;
};

export type FeedReactionCounts = {
  comments: number;
  likes: number;
  bookmarks: number;
};

export type FeedCardProps = {
  author: FeedAuthor;
  /** 작성 시각(ISO 8601). `<time datetime>` 원본값이자 dateLabel이 없을 때의 표시 소스. */
  createdAt: string;
  /**
   * 날짜 표시 라벨. 서버가 계산한 상대 시각(timeAgo, 예: "10일 전")을 그대로 노출하기 위한 슬롯.
   * 없으면 카드가 createdAt을 "M월 D일"로 포맷한다(데모/구버전 응답 폴백).
   */
  dateLabel?: string;
  title: string;
  body: string;
  /** 0개=없음 / 1개=단일 / N개=대표 1장 + "+N" 뱃지. */
  images?: FeedImage[];
  counts: FeedReactionCounts;
  // 상태는 상위가 소유(controlled). 카드는 표현만 하고 토글 결과를 콜백으로 위임한다.
  /** 내가 댓글을 남겼는지 — 활성 시 댓글 아이콘이 채워진다(토글 아님, 상태 표시). */
  commented?: boolean;
  liked?: boolean;
  bookmarked?: boolean;
  /** 카드 탭 → 상세 진입. 카드 전체 영역이 대상이고, 내부 버튼(더보기·리액션·⋮)은 제외된다. */
  onPress?: () => void;
  onPressComment?: () => void;
  onToggleLike?: () => void;
  onToggleBookmark?: () => void;
  onPressMore?: () => void;
  /**
   * 헤더 우측 ⋮ 슬롯. 메뉴 항목은 소유자 여부·삭제/신고 API를 알아야 해 카드가 소유하지 않는다
   * → 호출부가 트리거+드롭다운을 통째로 넘긴다(FeedCardMenu). 없으면 onPressMore 버튼으로 폴백.
   */
  menu?: ReactNode;
  className?: string;
};

/**
 * 커뮤니티 피드 카드.
 *
 * 기본 사용은 단일 props(`<FeedCard ... />`)로 단순하게. 내부 구성요소(Header/Body/Images/Reactions)는
 * 함께 export해 두어, 투표·공지 등 카드 변형이 생기면 합성으로 확장할 수 있다.
 *
 * 색상은 `feed-card-*` / `reaction-bar-*` 토큰만 사용한다(하드코딩 색상 없음).
 */
export function FeedCard({
  author,
  createdAt,
  dateLabel,
  title,
  body,
  images,
  counts,
  commented = false,
  liked = false,
  bookmarked = false,
  onPress,
  onPressComment,
  onToggleLike,
  onToggleBookmark,
  onPressMore,
  menu,
  className,
}: FeedCardProps) {
  // 카드 전체 영역(본문·이미지·여백) 탭으로 상세에 들어간다.
  // 카드를 <button>으로 감싸면 내부 버튼(더보기·리액션·⋮)이 중첩되므로, article에 클릭만 얹고
  // 이벤트 출처가 버튼/링크면 무시한다 — 예외 영역을 호출부가 따로 표시할 필요가 없다.
  // 키보드·스크린리더 진입점은 제목 버튼이 그대로 담당한다(article에 role/tabIndex를 더하면
  // 같은 동작의 탭 스톱이 중복되고, 그 안의 버튼들과 위젯 중첩이 된다).
  function handleCardPress(event: MouseEvent<HTMLElement>) {
    if (!onPress) return;
    if (event.target instanceof Element && event.target.closest("button, a")) {
      return;
    }
    onPress();
  }

  return (
    <article
      onClick={onPress ? handleCardPress : undefined}
      className={cn(
        "flex flex-col bg-surface-container px-4",
        onPress && "cursor-pointer",
        className,
      )}
    >
      <FeedCardHeader
        author={author}
        createdAt={createdAt}
        dateLabel={dateLabel}
        onPressMore={onPressMore}
        menu={menu}
      />
      {/* 헤더행 → 제목행 간격 8 */}
      <FeedCardBody
        title={title}
        body={body}
        onPress={onPress}
        className="mt-2"
      />
      {images && images.length > 0 ? (
        <FeedCardImages images={images} className="mt-3" />
      ) : null}
      {/* 본문행 → 리액션행 간격 8 */}
      <FeedCardReactions
        counts={counts}
        commented={commented}
        liked={liked}
        bookmarked={bookmarked}
        onPressComment={onPressComment}
        onToggleLike={onToggleLike}
        onToggleBookmark={onToggleBookmark}
        className="mt-2"
      />
    </article>
  );
}

/** ISO 문자열 → "M월 D일" 표시 라벨. 파싱 실패 시 원문 반환. */
function formatDateLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

/**
 * 카드 헤더 아바타 (size-6, 폴백 아이콘 16).
 *
 * src가 없거나 이미지 로드에 실패하면(onError) 기본 아이콘(PersonIcon)으로 폴백한다 — 엑박 방지.
 * SSR로 그려진 <img>는 하이드레이션 전에 error가 나 onError를 놓칠 수 있어, 마운트 시
 * 이미 로드 실패한(complete && naturalWidth===0) 상태를 직접 감지해 폴백 처리한다.
 */
function FeedCardAvatar({ avatarUrl }: { avatarUrl?: string }) {
  const [failed, setFailed] = useState(false);

  // ref 콜백은 DOM 부착 직후(커밋 시점) 실행되므로, 하이드레이션 전에 이미 깨진
  // (complete && naturalWidth===0) 이미지를 즉시 감지해 폴백한다 — onError를 놓치는 경우 보완.
  const detectBrokenImage = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth === 0) {
      setFailed(true);
    }
  }, []);

  const showImage = Boolean(avatarUrl) && !failed;

  return (
    <span className="inline-flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-feed-card-header-avatar-bg text-icon-subtle">
      {showImage ? (
        // 공통 컴포넌트라 호출처 이미지 도메인이 다양 → next/image 설정 의존을 피해 plain img 사용.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={detectBrokenImage}
          src={avatarUrl}
          alt=""
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        // 동그라미 배경은 유지하고 기본 아이콘만 16x16으로(가운데 정렬은 span이 담당)
        <PersonIcon size={16} />
      )}
    </span>
  );
}

export function FeedCardHeader({
  author,
  createdAt,
  dateLabel,
  onPressMore,
  menu,
}: {
  author: FeedAuthor;
  createdAt: string;
  dateLabel?: string;
  onPressMore?: () => void;
  menu?: ReactNode;
}) {
  return (
    // 헤더는 items-start: user-header 묶음을 카드 헤더 좌상단에 붙인다.
    // 더보기 버튼(28)이 헤더 높이를 결정하고, user-header(24)는 위쪽 정렬로 남는다.
    <header className="flex items-start">
      {/* user-header: 아바타·닉네임·날짜 묶음. 좌상단 정렬, 묶음 내부는 수직 가운데. */}
      <div className="flex items-center">
        {/* key=URL: 아바타 URL이 바뀌면 컴포넌트를 재마운트해 폴백 상태(failed)를 초기화한다. */}
        <FeedCardAvatar key={author.avatarUrl ?? "none"} avatarUrl={author.avatarUrl} />
        {/* 아바타→닉네임 8, 닉네임→날짜 6 (요소별 간격이 달라 gap 대신 ml로 지정) */}
        {/* 닉네임: BodyM(Pretendard Medium 16) */}
        <span className="ml-2 text-base font-medium text-feed-card-header-username-text">
          {author.name}
        </span>
        {/* 날짜: Label M(Pretendard Medium 12) */}
        <time
          dateTime={createdAt}
          className="ml-1.5 text-xs font-medium text-feed-card-header-date-text"
        >
          {dateLabel ?? formatDateLabel(createdAt)}
        </time>
      </div>
      {/* 드롭다운을 버튼 기준으로 띄우려면 앵커가 필요해 relative 래퍼로 감싼다. */}
      {menu ? <div className="relative ml-auto">{menu}</div> : null}
      {!menu && onPressMore ? (
        <button
          type="button"
          onClick={onPressMore}
          aria-label="게시물 메뉴 열기"
          className="ml-auto inline-flex h-7 w-8 items-center justify-center text-feed-card-header-more-icon"
        >
          <MoreVerticalIcon size={16} />
        </button>
      ) : null}
    </header>
  );
}

export function FeedCardBody({
  title,
  body,
  onPress,
  className,
}: {
  title: string;
  body: string;
  onPress?: () => void;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const bodyRef = useRef<HTMLParagraphElement>(null);

  // 클램프된 상태에서 실제 높이가 보이는 높이를 넘으면 "더보기"를 노출한다.
  // 펼친 뒤에는 재측정하지 않는다(early return) — 깜빡임/불필요 측정 방지.
  useEffect(() => {
    if (expanded) return;
    const el = bodyRef.current;
    if (!el) return;
    setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [body, expanded]);

  const Title = onPress ? "button" : "p";

  return (
    // 제목행 → 본문행 간격 4 (gap-1)
    <div className={cn("flex flex-col gap-1", className)}>
      {/* 제목: Body M(Pretendard Medium 16) */}
      <Title
        type={onPress ? "button" : undefined}
        onClick={onPress}
        className={cn(
          "line-clamp-1 text-left text-base font-medium text-feed-card-body-title-text",
        )}
      >
        {title}
      </Title>
      {/* 본문: Body S Multi-line(14/21) */}
      <p
        ref={bodyRef}
        className={cn(
          "whitespace-pre-wrap text-sm leading-[21px] text-feed-card-body-text",
          !expanded && "line-clamp-3",
        )}
      >
        {body}
      </p>
      {!expanded && overflowing ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="self-start text-sm text-feed-card-body-more-text"
        >
          더보기
        </button>
      ) : null}
    </div>
  );
}

export function FeedCardImages({
  images,
  ratio = "auto",
  className,
}: {
  images: FeedImage[];
  /**
   * 이미지 영역 비율.
   * - `auto`(기본, 피드 카드): 원본 비율 유지 + 최대 높이 458.
   * - `square`(상세): 1:1 고정 — 상세는 여러 장을 가로 캐러셀로 넘길 예정이라 장마다 높이가
   *   달라지면 안 된다. 어떤 기준으로 통일할지(크롭 vs 여백)는 정책 확정 대기 중이라,
   *   지금은 디자인 샘플대로 1:1 + 가운데 크롭만 맞춘다.
   */
  ratio?: "auto" | "square";
  className?: string;
}) {
  const [cover] = images;
  if (!cover) return null;

  return (
    <div className={cn("overflow-hidden rounded-2xl", className)}>
      {/* 가로는 카드 내용 폭(343)에 꽉 채운다. 초과분은 object-cover로 center crop. */}
      {/* auto: 높이는 원본 비율대로 자동, 최대 458(343의 4:3 세로 기준). 최소 높이 없음. */}
      {/* 비어 있을 때 채움색: Color/Cool Gray/50 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cover.url}
        alt={cover.alt ?? ""}
        width={cover.width}
        height={cover.height}
        className={cn(
          "w-full bg-[var(--cool-gray-50)] object-cover object-center",
          ratio === "square" ? "aspect-square" : "max-h-[458px]",
        )}
      />
      {/* +N 뱃지: 임시 삭제 (다중 이미지 레이아웃 스펙 확정 시 복원) */}
    </div>
  );
}

export function FeedCardReactions({
  counts,
  commented = false,
  liked = false,
  bookmarked = false,
  onPressComment,
  onToggleLike,
  onToggleBookmark,
  className,
}: {
  counts: FeedReactionCounts;
  commented?: boolean;
  liked?: boolean;
  bookmarked?: boolean;
  onPressComment?: () => void;
  onToggleLike?: () => void;
  onToggleBookmark?: () => void;
  className?: string;
}) {
  // 우측 정렬. 항목 간 간격은 각 버튼의 좌우 패딩이 담당하므로 별도 gap을 두지 않는다.
  return (
    <div className={cn("flex items-center justify-end", className)}>
      <ReactionButton
        icon={<CommentIcon size={16} filled={commented} />}
        count={counts.comments}
        label={`댓글 ${counts.comments}개`}
        active={commented}
        activeColorClass="text-reaction-bar-active-comment-icon"
        onClick={onPressComment}
      />
      <ReactionButton
        icon={<HeartIcon size={16} filled={liked} />}
        count={counts.likes}
        label={`좋아요 ${counts.likes}개`}
        active={liked}
        activeColorClass="text-reaction-bar-active-like-icon"
        onClick={onToggleLike}
      />
      <ReactionButton
        icon={<BookmarkIcon size={16} filled={bookmarked} />}
        count={counts.bookmarks}
        label={`북마크 ${counts.bookmarks}개`}
        active={bookmarked}
        activeColorClass="text-reaction-bar-active-bookmark-icon"
        onClick={onToggleBookmark}
      />
    </div>
  );
}

/**
 * 리액션 단일 버튼(아이콘 + 카운트). 높이 28 고정, 아이콘 16x16.
 * - 카운트가 0이면 숫자를 숨기고 버튼을 32x28(아이콘 가운데)로 둔다.
 * - 카운트가 있으면 폭은 유동: 아이콘 좌측 8 · 아이콘↔숫자 4 · 숫자 우측 8.
 * active 시 토큰 활성 색상으로 전환.
 */
function ReactionButton({
  icon,
  count,
  label,
  active = false,
  activeColorClass,
  onClick,
}: {
  icon: ReactNode;
  count: number;
  label: string;
  active?: boolean;
  activeColorClass?: string;
  onClick?: () => void;
}) {
  const showCount = count > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={activeColorClass ? active : undefined}
      className={cn(
        "inline-flex h-7 items-center text-reaction-bar-default-icon",
        showCount ? "gap-1 pl-2 pr-2" : "w-8 justify-center",
        active && activeColorClass,
      )}
    >
      {icon}
      {showCount ? (
        // 숫자: Body S(14/21)
        <span
          className={cn(
            "text-sm leading-[21px] text-reaction-bar-default-count-text",
            active && "text-reaction-bar-active-count-text",
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}
