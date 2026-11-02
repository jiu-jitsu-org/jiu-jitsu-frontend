import type { PostAuthor } from "@/features/community/domain/post";
import { Avatar } from "@/features/community/presentation/avatar";
import { AuthorProfileLink } from "@/features/community/presentation/author-profile-link";
import { BeltAvatar } from "@/features/community/presentation/belt-avatar";
import { CoachBadge } from "@/features/community/presentation/coach-badge";

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
  // 홈 피드 카드 작성자 줄과 같은 모양(#299): row 높이는 띠 아바타(32)가 정한다,
  // 아바타↔닉네임 간격 6(gap-1.5), 수직 가운데(items-center).
  // 탭 영역이 행 전체 폭으로 늘어나지 않게 self-start로 내용 폭만 차지한다.
  return (
    <AuthorProfileLink
      userId={author.userId}
      isOwner={isOwner}
      className="flex items-center gap-1.5 self-start"
    >
      {/* 프로필 사진, 로드 실패 시 기본 상태 폴백.
          홈 피드 카드와 같이 사진 24 둘레에 띠를 그린다(#265·#299, 전체 32). 띠가 없으면 회색 점선. */}
      <BeltAvatar belt={author.belt ?? null} size="card">
        <Avatar src={author.avatarUrl} className="size-full" iconSize={16} />
      </BeltAvatar>
      {/* 닉네임: Body S(Pretendard Medium 14) — 홈 카드와 같은 크기. 제목(16)보다 작아 "누가"가 "무엇"보다 앞서지 않는다.
          관장·사범이면 배지를 붙여 둔다(#272, 간격 2). */}
      <span className="flex items-center gap-0.5">
        <span className="text-body-s text-text-primary">
          {author.nickname}
        </span>
        {author.isCoach ? <CoachBadge /> : null}
      </span>
    </AuthorProfileLink>
  );
}
