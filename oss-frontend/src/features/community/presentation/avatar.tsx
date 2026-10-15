"use client";

import { useCallback, useState } from "react";

import {
  type ImageReveal,
  imageRevealClassName,
  readSettledImage,
  revealOnAttach,
  revealOnLoad,
} from "@/features/community/presentation/image-fallback";
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
  // 받는 중이던 사진만 다 불러온 뒤에 옅게 나타난다(image-fallback의 ImageReveal).
  const [reveal, setReveal] = useState<ImageReveal>(undefined);

  // 하이드레이션 전에 이미 끝난 이미지는 load/error 이벤트를 놓치므로 부착 시점에 직접 확인한다.
  // src가 바뀌면 콜백 identity가 바뀌어 새 이미지에 대해 다시 실행된다 — 등장 상태도 여기서 새로 정한다.
  const detectSettledImage = useCallback(
    (img: HTMLImageElement | null) => {
      if (!img) return;
      if (readSettledImage(img) === "failed") setFailedSrc(src ?? null);
      setReveal(revealOnAttach(img));
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
          ref={detectSettledImage}
          src={src ?? undefined}
          alt=""
          // 다 불러오기 전에는 동그라미 바탕만 보이고, 불러오면 옅게 나타난다.
          className={cn("size-full object-cover", imageRevealClassName(reveal))}
          onLoad={() => setReveal(revealOnLoad)}
          onError={() => setFailedSrc(src ?? null)}
        />
      ) : (
        <PersonIcon size={iconSize} />
      )}
    </span>
  );
}
