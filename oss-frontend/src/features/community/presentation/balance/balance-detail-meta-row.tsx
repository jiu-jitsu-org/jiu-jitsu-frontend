/**
 * 밸런스 게임 상세 메타 행 (서버 컴포넌트): 조회수 · 날짜.
 *
 * 게시글 상세의 PostMetaRow와 **일부러 분리한다.** 타이포·색은 같지만 항목 순서가 다르고
 * (게시글은 날짜 → 조회수, 여기는 조회수 → 날짜) 수정됨 표기가 없다. 무엇보다 밸런스 상세의
 * 디자인 가이드는 게시글과 독립이라, 한쪽을 고칠 때 다른 쪽이 따라 움직이면 안 된다.
 *
 * FIXME(조회수): 밸런스 게임 응답에 조회수 필드가 없다(contentId · endAt · serverTime · closed ·
 * optionA/B · totalVoteCount · myVote · commentCount · likeCount · isLiked가 전부). 지금은 0을
 * 넣어 자리만 잡아 둔다 — BE에 필드가 추가되면 props로 받아 넘기기만 하면 된다.
 *
 * FIXME(날짜): 날짜 표기 정책이 아직 없어 문구를 "날짜"로 하드코딩한다(디자인 요청). 정책이
 * 서면 게시글처럼 서버 timeAgo를 쓸지, 절대 시각을 포맷할지 정한 뒤 교체한다.
 */
export function BalanceDetailMetaRow({ className }: { className?: string }) {
  return (
    // Label M(12/16/500), 색 feed-card/header/date-text, 항목 간격 10, 왼쪽 정렬.
    <div
      className={
        "flex items-center gap-2.5 text-label-m text-feed-card-header-date-text" +
        (className ? ` ${className}` : "")
      }
    >
      <span>조회 0</span>
      <span>날짜</span>
    </div>
  );
}
