import type { PostAuthor } from "@/features/community/domain/post";
import { PersonIcon } from "@/shared/ui/icons";

/**
 * 상세 화면 작성자 행 (서버 컴포넌트).
 *
 * FeedCardHeader는 날짜·⋮를 한 헤더에 묶지만, 상세는 날짜가 별도 meta행이고 ⋮는 앱바에 있다.
 * 그래서 재사용 대신 아바타+닉네임만 담은 작은 행을 둔다(아바타 fallback은 PersonIcon 재사용).
 */
export function PostAuthorRow({ author }: { author: PostAuthor }) {
  // row 높이 24 고정, 아바타↔닉네임 간격 8(gap-2), 수직 가운데(items-center)
  return (
    <div className="flex h-6 items-center gap-2">
      {/* 프로필 아이콘 24x24 고정 */}
      <span className="inline-flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-feed-card-header-avatar-bg text-icon-subtle">
        {author.avatarUrl ? (
          // 공통 카드와 동일하게 호출처 이미지 도메인이 다양 → next/image 설정 의존을 피해 plain img 사용.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={author.avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          <PersonIcon size={16} />
        )}
      </span>
      {/* 닉네임: Body M(Pretendard Medium 16) */}
      <span className="text-base font-medium text-feed-card-header-username-text">
        {author.nickname}
      </span>
    </div>
  );
}
