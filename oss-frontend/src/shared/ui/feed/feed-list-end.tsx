import { cn } from "@/shared/lib/cn";

/**
 * 피드 리스트의 끝 표식.
 *
 * 더 불러올 게시물이 없을 때(마지막 카드 아래) 한 번 노출한다.
 * 상호작용이 없는 정적 표현이라 Server Component로 둔다(`"use client"` 없음).
 * 색상은 `feed-card-end-*` 토큰만 사용한다(하드코딩 색상 없음).
 */
export function FeedListEnd({
  message = "여기가 끝이에요, 오쓰!",
  className,
}: {
  /** 표시 문구. 기본값은 피드 종료 안내. */
  message?: string;
  className?: string;
}) {
  return (
    // 높이 69 고정, 좌우 인셋 16(px-4)으로 디바이스 폭에 꽉 차게. 문구는 가로·세로 가운데.
    // 폰트: Body S(14/21). 색상: feed-card/end-text 토큰.
    <div
      className={cn(
        "flex h-[69px] items-center justify-center px-4",
        className,
      )}
    >
      <p className="text-center text-sm leading-[21px] text-feed-card-end-text">
        {message}
      </p>
    </div>
  );
}
