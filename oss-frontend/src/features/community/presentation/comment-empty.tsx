/**
 * 댓글이 없을 때의 빈 상태 (서버 컴포넌트).
 *
 * - 손 40, 첫 줄 Body M 회색, 둘째 줄 Body S 더 옅은 회색 — 손 28 · Body S · Label M일 때 글자가 너무 작아
 *   안내가 넓은 빈 칸에 묻혀 보였다. 여전히 글 상세 제목(Title 3)보다는 한 단계 낮다.
 * - 오스 손 그림 : 40, 문구 위 12(gap-3). 3D 손동작 세트의 "OSS · 샤카" 손에 하늘색을 입힌 그림
 *   (배경을 걷어낸 144px @4x PNG). 흰 장갑은 흰 배경에서 옅어서, 밝기에 따라 blue-50(밝은 면) ·
 *   blue-100(중간) · blue-300~500(음영)으로 물들였다 — 세트의 다른 손동작도 같은 값으로 맞춘다.
 *   문구가 떠오른 뒤 손목(왼쪽 아래 소매)을 축으로 딸랑딸랑 두 번만 흔들린다(oss-wave, 반복 없음).
 *   동작 줄이기면 멈춘 그림만.
 * - "댓글이 아직 없습니다." : 제목·정렬 줄 바텀과 24 간격(그 줄의 pb-3 12 + 여기 pt-3 12),
 *   Body M, feed-card/body/body-text.
 * - "첫 댓글을 남겨주세요! 오스!" : 위 문구와 4 간격(gap-1) — 두 줄이 한 덩어리로 읽히게 손↔문구(12)보다
 *   좁힌다. Body S, feed-card/header/date-text.
 * - 아래 여백 32(pb-8): 아래 "○○의 다른 글" 띠까지 40(+ 띠 mt-2 8) — 문구가 띠에 붙어 보이지 않게. 글 상세의 첫 화면 최소 높이는
 *   data-comment-empty가 있으면 풀린다(post-detail-view) — 빈 칸이 화면 끝까지 늘어나지 않게.
 * - 다른 빈 상태(EmptyState)와 같이 8px 아래에서 올라오며 나타난다.
 */
export function CommentEmpty() {
  return (
    <div data-comment-empty
      className="flex flex-col items-center gap-3 pb-8 pt-3 text-center motion-safe:animate-rise-in">
      {/* 장식 그림이라 alt를 비운다. 정적 자산이라 next/image 불필요. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/comment/oss-hand.png"
        alt=""
        width={40}
        height={40}
        className="size-10 origin-[35%_90%] motion-safe:animate-oss-wave"
      />
      <div className="flex flex-col gap-1">
        <p className="text-body-m text-feed-card-body-text">
          댓글이 아직 없습니다.
        </p>
        <p className="text-body-s text-feed-card-header-date-text">
          첫 댓글을 남겨주세요! 오스!
        </p>
      </div>
    </div>
  );
}
