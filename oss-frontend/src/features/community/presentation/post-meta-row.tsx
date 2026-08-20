import { cn } from "@/shared/lib/cn";

/**
 * 상세 화면 메타 행 (서버 컴포넌트): 작성일 · 조회수 · 수정됨.
 *
 * 제목 바로 아래에 표시된다. 날짜는 Label M(Pretendard Medium 12).
 * mockup 예: "8일 전   조회 0   수정됨"
 *
 * 날짜는 서버가 계산한 상대 시각(timeAgo)이 정본이다 — 목록 카드와 기준·문구를 어긋나지 않게 하려고
 * FE에서 다시 계산하지 않는다. 구버전 응답 등으로 없을 때만 createdAt을 절대 시각으로 포맷해 폴백한다.
 * 조회수(views)는 0이어도 노출한다(디자인 기준). 필드 자체가 없을 때만 생략.
 */

/** ISO → "YY년 M월 D일 HH:mm". 파싱 실패 시 원문 반환. */
function formatPostDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const yy = String(date.getFullYear()).slice(2);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");

  return `${yy}년 ${month}월 ${day}일 ${hh}:${mm}`;
}

export function PostMetaRow({
  createdAt,
  timeAgo,
  views,
  edited,
  className,
}: {
  createdAt: string;
  timeAgo?: string;
  views?: number;
  edited: boolean;
  className?: string;
}) {
  return (
    // Label M(12, Medium), 색상 feed-card/header/date-text, 항목 간격 10(gap-2.5)
    <div
      className={cn(
        "flex items-center gap-2.5 text-xs font-medium text-feed-card-header-date-text",
        className,
      )}
    >
      <time dateTime={createdAt}>
        {timeAgo ?? formatPostDateTime(createdAt)}
      </time>
      {typeof views === "number" ? <span>조회 {views}</span> : null}
      {edited ? <span>수정됨</span> : null}
    </div>
  );
}
