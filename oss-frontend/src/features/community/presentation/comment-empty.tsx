/**
 * 오스 손동작 그림 — 첫 댓글을 가볍게 유도한다(#252).
 *
 * FIXME(#252): 3D 아이콘 에셋이 나오기 전 임시 이모지. 앱 그래픽 교체 작업(로그인·스플래시·프로필) 톤의
 * PNG가 오면 public/images/comment/에 두고 같은 크기(36)의 <img alt="">로 바꾼다 — 모션·간격은 그대로 쓴다.
 */
const OSS_HAND_PLACEHOLDER = "👊";

/**
 * 댓글이 없을 때의 빈 상태 (서버 컴포넌트).
 *
 * - 오스 손 그림 : 36, 문구 위 12(gap-3). 문구보다 앞에 나서지 않게 작게 두고, 문구가 떠오른 뒤
 *   손목을 축으로 딸랑딸랑 두 번만 흔들린다(oss-wave, 반복 없음). 동작 줄이기면 멈춘 그림만.
 * - "댓글이 아직 없습니다." : 최신순 버튼 바텀과 24 간격(정렬 row의 pb-3 12 + 여기 pt-3 12),
 *   Body M, feed-card/header/username-text.
 * - "첫 댓글을 남겨주세요! 오스!" : 위 문구와 12 간격(gap-3), Body S, feed-card/body/body-text.
 * - 다른 빈 상태(EmptyState)와 같이 8px 아래에서 올라오며 나타난다.
 */
export function CommentEmpty() {
  return (
    <div className="flex flex-col items-center gap-3 pb-16 pt-3 text-center motion-safe:animate-rise-in">
      <span
        aria-hidden
        className="inline-block origin-bottom text-[36px] leading-none motion-safe:animate-oss-wave"
      >
        {OSS_HAND_PLACEHOLDER}
      </span>
      <p className="text-body-m text-text-primary">
        댓글이 아직 없습니다.
      </p>
      <p className="text-body-s text-feed-card-body-text">
        첫 댓글을 남겨주세요! 오스!
      </p>
    </div>
  );
}
