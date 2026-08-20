/**
 * 댓글이 없을 때의 빈 상태 (서버 컴포넌트).
 *
 * - "댓글이 아직 없습니다." : 최신순 버튼 바텀과 24 간격(정렬 row의 pb-3 12 + 여기 pt-3 12),
 *   Body M, feed-card/header/username-text.
 * - "첫 댓글을 남겨주세요! 오스!" : 위 문구와 12 간격(gap-3), Body S, feed-card/body/body-text.
 */
export function CommentEmpty() {
  return (
    <div className="flex flex-col items-center gap-3 pb-16 pt-3 text-center">
      <p className="text-base font-medium text-feed-card-header-username-text">
        댓글이 아직 없습니다.
      </p>
      <p className="text-sm leading-[21px] text-feed-card-body-text">
        첫 댓글을 남겨주세요! 오스!
      </p>
    </div>
  );
}
