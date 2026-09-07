import { formatDetailDateTime } from "@/features/community/presentation/format-detail-date";

/**
 * 밸런스 게임 상세 메타 행 (서버 컴포넌트): 조회수 · 날짜.
 *
 * 게시글 상세의 PostMetaRow와 **일부러 분리한다.** 타이포·색은 같지만 항목 순서가 다르고
 * (게시글은 날짜 → 조회수, 여기는 조회수 → 날짜) 수정됨 표기가 없다. 무엇보다 밸런스 상세의
 * 디자인 가이드는 게시글과 독립이라, 한쪽을 고칠 때 다른 쪽이 따라 움직이면 안 된다.
 *
 * 날짜 규칙만은 게시글과 같다 — 서버가 계산한 상대 시각(timeAgo)이 정본이고, 없을 때만
 * createdAt을 절대 시각으로 포맷한다(formatDetailDateTime 공용). FE가 상대 시각을 다시 계산하면
 * 같은 화면의 댓글 시각과 기준이 갈린다.
 */
export function BalanceDetailMetaRow({
  views = 0,
  createdAt,
  timeAgo,
  className,
}: {
  /** 조회수. 0이어도 노출한다(디자인 기준). */
  views?: number;
  /** 생성 일시(ISO 8601). timeAgo가 없을 때만 포맷해 쓴다. */
  createdAt?: string;
  /** 서버가 계산한 상대 시각(예: "9시간 전"). 날짜의 정본. */
  timeAgo?: string;
  className?: string;
}) {
  const date = timeAgo ?? (createdAt ? formatDetailDateTime(createdAt) : null);

  return (
    // Label M(12/16/500), 색 feed-card/header/date-text, 항목 간격 10, 왼쪽 정렬.
    <div
      className={
        "flex items-center gap-2.5 text-label-m text-feed-card-header-date-text" +
        (className ? ` ${className}` : "")
      }
    >
      <span>조회 {views}</span>
      {/*
        날짜는 값이 있을 때만 그린다. 업스트림이 아직 timeAgo·createdAt을 내려주지 않아,
        빈 문자열이나 "Invalid Date"를 그리는 대신 항목째 뺀다 — 게시글 메타 행이 조회수를
        필드가 없을 때만 생략하는 것과 같은 규칙이다.
      */}
      {date !== null ? <time dateTime={createdAt}>{date}</time> : null}
    </div>
  );
}
