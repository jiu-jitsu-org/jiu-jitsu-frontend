"use client";

import { useState } from "react";

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
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

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
          src={src ?? undefined}
          alt=""
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <PersonIcon size={iconSize} />
      )}
    </span>
  );
}
