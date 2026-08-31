import type { PostTag } from "@/features/community/domain/post";
import { cn } from "@/shared/lib/cn";

/**
 * 게시글 태그 행 (서버 컴포넌트). 예: "# 드릴 # 서브미션 # 드릴2".
 *
 * - 개수 제한 없음 → 폭을 넘치면 자동 줄바꿈(flex-wrap). 좌우 16 마진은 상위 article(px-4)이 유지.
 * - 태그 간격 8(gap-2, 가로·세로 공통). 폰트 Label M(12), 색상 feed-card/tag/text.
 * - 태그가 없으면 렌더하지 않는다.
 */
export function PostTags({
  tags,
  className,
}: {
  tags: PostTag[];
  className?: string;
}) {
  if (tags.length === 0) return null;

  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {tags.map((tag) => (
        <li
          key={tag.id}
          className="text-label-m text-feed-card-tag-text"
        >
          # {tag.name}
        </li>
      ))}
    </ul>
  );
}
