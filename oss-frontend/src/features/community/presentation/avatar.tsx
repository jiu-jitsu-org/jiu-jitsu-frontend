"use client";

import { useCallback, useState } from "react";

import { readSettledImage } from "@/features/community/presentation/image-fallback";
import { cn } from "@/shared/lib/cn";
import { PersonIcon } from "@/shared/ui/icons";

/**
 * 프로필 아바타 (클라이언트 leaf).
 *
 * src가 없거나 이미지 로드에 실패하면(onError) 기본 상태(PersonIcon)로 폴백한다 — 엑박 방지.
 * 컨테이너 크기는 className(예: "size-6")으로, 폴백 아이콘 크기는 iconSize로 지정.
 */
export function Avatar({
  src,
  className,
  iconSize,
}: {
  src?: string | null;
  className?: string;
  iconSize: number;
}) {
  // 실패 여부(boolean)가 아니라 "실패한 주소"를 기억한다 — src가 바뀌면 비교 결과가 저절로
  // 달라져 새 이미지를 다시 시도하므로, 폴백을 풀어주는 초기화 로직이 필요 없다.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  // 아바타는 실패만 본다 — 성공 시 할 일이 없다(대체 아이콘을 안 띄우면 그만).
  // src가 바뀌면 콜백 identity가 바뀌어 새 이미지에 대해 다시 실행된다.
  const detectBrokenImage = useCallback(
    (img: HTMLImageElement | null) => {
      if (readSettledImage(img) === "failed") setFailedSrc(src ?? null);
    },
    [src],
  );

  const showImage = Boolean(src) && failedSrc !== src;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-feed-card-header-avatar-bg text-icon-subtle",
        className,
      )}
    >
      {showImage ? (
        // 공통 컴포넌트라 호출처 이미지 도메인이 다양 → next/image 설정 의존을 피해 plain img 사용.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={detectBrokenImage}
          src={src ?? undefined}
          alt=""
          className="size-full object-cover"
          onError={() => setFailedSrc(src ?? null)}
        />
      ) : (
        <PersonIcon size={iconSize} />
      )}
    </span>
  );
}
