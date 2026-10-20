import { EmptyState } from "@/features/community/presentation/empty-state";

/**
 * 차단한 회원이 없을 때 — 공용 EmptyState(제목 + 설명).
 * 세로 위치는 로그인 안내(guest)와 같은 뷰포트 35% 지점.
 */
export function BlockedMembersEmptyState() {
  return (
    <EmptyState
      title="차단한 회원이 없어요"
      description="차단하면 그 회원의 글과 댓글이 보이지 않아요."
      className="pt-[35vh]"
    />
  );
}
