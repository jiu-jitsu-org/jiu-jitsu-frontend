/**
 * 댓글이 없을 때의 빈 상태 (서버 컴포넌트).
 *
 * - 오스 손 그림 : 36, 문구 위 12(gap-3). 3D 손동작 세트의 "OSS · 샤카" 손에 하늘색을 입힌 그림
 *   (배경을 걷어낸 144px @4x PNG). 흰 장갑은 흰 배경에서 옅어서, 밝기에 따라 blue-50(밝은 면) ·
 *   blue-100(중간) · blue-300~500(음영)으로 물들였다 — 세트의 다른 손동작도 같은 값으로 맞춘다.
 *   문구보다 앞에 나서지 않게 작게 두고, 문구가 떠오른 뒤 손목(왼쪽 아래 소매)을 축으로 딸랑딸랑
 *   두 번만 흔들린다(oss-wave, 반복 없음). 동작 줄이기면 멈춘 그림만.
 * - "댓글이 아직 없습니다." : 최신순 버튼 바텀과 24 간격(정렬 row의 pb-3 12 + 여기 pt-3 12),
 *   Body M, feed-card/header/username-text.
 * - "첫 댓글을 남겨주세요! 오스!" : 위 문구와 6 간격(gap-1.5) — 두 줄이 한 덩어리로 읽히게 손↔문구(12)보다
 *   좁힌다. Body S, feed-card/body/body-text.
 * - 다른 빈 상태(EmptyState)와 같이 8px 아래에서 올라오며 나타난다.
 */
export function CommentEmpty() {
  return (
    <div className="flex flex-col items-center gap-3 pb-16 pt-3 text-center motion-safe:animate-rise-in">
      {/* 장식 그림이라 alt를 비운다. 정적 자산이라 next/image 불필요. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/comment/oss-hand.png"
        alt=""
        width={36}
        height={36}
        className="size-9 origin-[35%_90%] motion-safe:animate-oss-wave"
      />
      <div className="flex flex-col gap-1.5">
        <p className="text-body-m text-text-primary">
          댓글이 아직 없습니다.
        </p>
        <p className="text-body-s text-feed-card-body-text">
          첫 댓글을 남겨주세요! 오스!
        </p>
      </div>
    </div>
  );
}
