/**
 * 불러오는 중 스피너 — 2px 테두리 원에서 위쪽만 비운 고리가 돈다.
 *
 * 서버 컴포넌트에서도 쓰도록 상태 없이 둔다. 바깥 칸은 0.15초 늦게 옅게 나타나
 * 빨리 끝나는 로딩에서는 스피너가 깜빡이지 않는다(motion-safe:animate-spinner-in).
 * 안쪽 고리는 동작 줄이기 설정이면 돌지 않고 천천히 숨 쉬듯 깜빡인다 — 멈춰도 로딩 중임은 보인다.
 * 두 애니메이션을 한 요소에 겹치면 animation 속성이 서로 덮어써서 칸을 둘로 나눴다.
 */
export function Spinner({
  label = "불러오는 중",
  className = "",
}: {
  /** 스크린리더가 읽는 이름. */
  label?: string;
  /** 크기 등 추가 클래스(기본 size-6). */
  className?: string;
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className="inline-flex motion-safe:animate-spinner-in"
    >
      <span
        className={`size-6 rounded-full border-2 border-feed-card-header-avatar-bg border-t-transparent motion-safe:animate-spin motion-reduce:animate-pulse ${className}`}
      />
    </span>
  );
}
