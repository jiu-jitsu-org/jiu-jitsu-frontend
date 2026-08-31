import type { PostAuthor } from "@/features/community/domain/post";
import { Avatar } from "@/features/community/presentation/avatar";

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
      {/* 프로필 아이콘 24x24 고정, 로드 실패 시 기본 상태 폴백 */}
      <Avatar src={author.avatarUrl} className="size-6" iconSize={16} />
      {/* 닉네임: Body M(Pretendard Medium 16) */}
      <span className="text-body-m text-feed-card-header-username-text">
        {author.nickname}
      </span>
    </div>
  );
}
