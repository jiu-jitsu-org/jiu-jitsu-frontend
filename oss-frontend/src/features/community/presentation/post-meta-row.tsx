import { PostDetailTime } from "@/features/community/presentation/post-detail-time";
import { cn } from "@/shared/lib/cn";

/**
 * 상세 화면 메타 행 (서버 컴포넌트): 카테고리 · 작성일(· 수정됨) · 조회수.
 *
 * 제목 바로 아래에 표시된다. 전 항목 Label M(Pretendard Medium 12), 같은 색·간격.
 * 예: "매트 위 수다   3일 전 · 수정됨   조회 0"
 *
 * 날짜는 공통 상대 시간 규칙이고, 탭하면 정확 시각으로 바뀐다(PostDetailTime, #188).
 * 수정됨은 시간 우측에 " · "로 붙인다(정책 5) — 독립 항목으로 두면 조회수와 같은 간격으로 떨어져
 * 무엇이 수정됐다는 건지 읽히지 않는다. 표시 시간 자체는 수정해도 작성 시각 그대로다(정책 4).
 * 조회수(views)는 0이어도 노출한다(디자인 기준). 필드 자체가 없을 때만 생략.
 */
export function PostMetaRow({
  categoryName,
  createdAt,
  views,
  edited,
  className,
}: {
  /** 카테고리명(#177). 빈 값이면 생략. */
  categoryName?: string;
  createdAt: string;
  views?: number;
  edited: boolean;
  className?: string;
}) {
  return (
    // Label M(12, Medium), 색상 feed-card/header/date-text, 항목 간격 10(gap-2.5).
    // 카테고리만 한 칸 진하게(category-text) — "무엇"과 "언제"가 한 단어처럼 붙어 읽히지 않게.
    <div
      className={cn(
        "flex items-center gap-2.5 text-label-m text-feed-card-header-date-text",
        className,
      )}
    >
      {categoryName ? (
        <span className="text-feed-card-header-category-text">{categoryName}</span>
      ) : null}
      <span>
        <PostDetailTime createdAt={createdAt} />
        {edited ? " · 수정됨" : null}
      </span>
      {typeof views === "number" ? <span>조회 {views}</span> : null}
    </div>
  );
}
