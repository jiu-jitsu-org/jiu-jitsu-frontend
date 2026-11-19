/**
 * '운영자' 배지 (#595) — 운영자 계정(author.isOperator)의 글 · 댓글 닉네임 옆에 붙인다.
 *
 * 댓글의 '작성자' 배지와 같은 모양(radius 4 · 패딩 좌우 4 · 상하 2 · Label M · 옅은 파랑 면에 파란 글자)이다 —
 * 닉네임 옆 글자 배지는 한 가지 모양으로 둔다. 관장 · 사범 인증(CoachBadge)과 둘 다면 인증 표시 뒤에 온다.
 * 글자 배지라 화면 낭독기는 닉네임 다음에 '운영자'를 그대로 읽는다.
 */
export function OperatorBadge() {
  return (
    <span className="shrink-0 rounded bg-surface-primary-subtle px-1 py-0.5 text-label-m text-interactive-primary">
      운영자
    </span>
  );
}
