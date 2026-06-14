"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/shared/lib/cn";
import {
  BookmarkIcon,
  CommentIcon,
  HeartIcon,
  MoreIcon,
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
  /** 작성 시각(ISO 8601). 표시 포맷은 카드가 담당하되 `<time datetime>`으로 원본도 노출. */
  createdAt: string;
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
  onPress?: () => void;
  onPressComment?: () => void;
  onToggleLike?: () => void;
  onToggleBookmark?: () => void;
  onPressMore?: () => void;
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
  className,
}: FeedCardProps) {
  return (
    <article
      className={cn("flex flex-col bg-surface-container px-4 py-4", className)}
    >
      <FeedCardHeader
        author={author}
        createdAt={createdAt}
        onPressMore={onPressMore}
      />
      {/* 헤더행 → 제목행 간격 12 */}
      <FeedCardBody
        title={title}
        body={body}
        onPress={onPress}
        className="mt-3"
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
  onPressMore,
}: {
  author: FeedAuthor;
  createdAt: string;
  onPressMore?: () => void;
}) {
  return (
    <header className="flex items-center">
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
        {formatDateLabel(createdAt)}
      </time>
      {onPressMore ? (
        <button
          type="button"
          onClick={onPressMore}
          aria-label="게시물 메뉴 열기"
          className="ml-auto inline-flex size-8 items-center justify-center text-feed-card-header-more-icon"
        >
          <MoreIcon size={20} />
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
  className,
}: {
  images: FeedImage[];
  className?: string;
}) {
  const [cover] = images;
  if (!cover) return null;

  return (
    <div className={cn("overflow-hidden rounded-2xl", className)}>
      {/* 폭은 카드 내용 폭(디바이스 폭)에 맞춤, 높이는 비율 343:220으로 예약해 CLS를 막는다. */}
      {/* 비어 있을 때 채움색: Color/Cool Gray/50 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cover.url}
        alt={cover.alt ?? ""}
        width={cover.width}
        height={cover.height}
        className="aspect-[343/220] w-full bg-[var(--cool-gray-50)] object-cover"
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
