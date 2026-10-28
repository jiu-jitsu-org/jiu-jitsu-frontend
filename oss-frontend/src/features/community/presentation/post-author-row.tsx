import type { PostAuthor } from "@/features/community/domain/post";
import { Avatar } from "@/features/community/presentation/avatar";
import { AuthorProfileLink } from "@/features/community/presentation/author-profile-link";

/**
 * 상세 화면 작성자 행 (서버 컴포넌트).
 *
 * FeedCardHeader는 ⋮를 헤더에 두지만, 상세는 ⋮가 앱바에 있다.
 * 그래서 재사용 대신 아바타+닉네임만 담은 작은 행을 둔다(아바타 fallback은 PersonIcon 재사용).
 *
 * 아바타+닉네임을 누르면 작성자 프로필을 연다 — 앱에서 내 글이면 MY 탭, 남의 글이면 그 회원 프로필 화면.
 */
export function PostAuthorRow({
  author,
  isOwner,
}: {
  author: PostAuthor;
  isOwner: boolean;
}) {
  // row 높이 24 고정, 아바타↔닉네임 간격 8(gap-2), 수직 가운데(items-center)
  // 탭 영역이 행 전체 폭으로 늘어나지 않게 self-start로 내용 폭만 차지한다.
  return (
    <AuthorProfileLink
      userId={author.userId}
      isOwner={isOwner}
      className="flex h-6 items-center gap-2 self-start"
    >
      {/* 프로필 아이콘 24x24 고정, 로드 실패 시 기본 상태 폴백 */}
      <Avatar src={author.avatarUrl} className="size-6" iconSize={16} />
      {/* 닉네임: Body M(Pretendard Medium 16) */}
      <span className="text-body-m text-text-primary">
        {author.nickname}
      </span>
    </AuthorProfileLink>
  );
}
