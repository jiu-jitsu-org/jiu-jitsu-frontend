"use client";

import type { ReactNode } from "react";

import { useOpenMyProfile } from "@/features/community/presentation/use-open-my-profile";
import { cn } from "@/shared/lib/cn";

/**
 * 내 이름(아바타·닉네임)을 눌러 내 프로필을 여는 탭 영역 (클라이언트 leaf).
 *
 * 상세 작성자 행처럼 서버 컴포넌트가 그리는 자리에서도 쓸 수 있게, 내용은 children으로 받고
 * 여는 동작만 여기서 쥔다. enabled가 false(남의 글·댓글)면 같은 모양의 정적 래퍼로 그린다 —
 * 다른 사람 프로필 API가 없어 아직 열 곳이 없기 때문이다.
 *
 * decorative: 같은 행에 이미 탭 영역이 있을 때(댓글의 아바타 ↔ 닉네임) 탭 순서·스크린리더에서
 * 중복되지 않도록 뺀다. 손가락으로 누르는 것은 그대로 된다.
 *
 * 동작: 앱 웹뷰에서는 OPEN_MY_PROFILE을 전송해 네이티브 MY 탭을 연다(#273).
 * 일반 브라우저에서는 /community/me(웹 폴백)로 이동한다.
 */
export function MyActivityLink({
  enabled,
  decorative = false,
  className,
  children,
}: {
  enabled: boolean;
  decorative?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const openMyProfile = useOpenMyProfile();

  if (!enabled) return <div className={className}>{children}</div>;

  return (
    <button
      type="button"
      tabIndex={decorative ? -1 : undefined}
      aria-hidden={decorative || undefined}
      onClick={(event) => {
        // 카드 · 행 전체 탭이 함께 반응하지 않게 끊는다.
        event.stopPropagation();
        openMyProfile();
      }}
      className={cn("text-left", className)}
    >
      {children}
    </button>
  );
}
