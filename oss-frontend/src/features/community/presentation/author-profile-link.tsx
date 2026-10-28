"use client";

import type { ReactNode } from "react";

import { useOpenAuthorProfile } from "@/features/community/presentation/use-open-author-profile";
import { cn } from "@/shared/lib/cn";

/**
 * 작성자 이름(아바타·닉네임)을 눌러 그 사람 프로필을 여는 탭 영역 (클라이언트 leaf).
 *
 * 상세 작성자 행처럼 서버 컴포넌트가 그리는 자리에서도 쓸 수 있게, 내용은 children으로 받고
 * 여는 동작만 여기서 쥔다. 앱에서 내 이름은 MY 탭, 남의 이름은 그 회원 프로필 화면(#271)을 연다.
 * 열 곳이 없으면(작성자 id 없음) 같은 모양의 정적 래퍼로 그린다.
 *
 * decorative: 같은 행에 이미 탭 영역이 있을 때(댓글의 아바타 ↔ 닉네임) 탭 순서·스크린리더에서
 * 중복되지 않도록 뺀다. 손가락으로 누르는 것은 그대로 된다.
 */
export function AuthorProfileLink({
  userId,
  isOwner,
  decorative = false,
  className,
  children,
}: {
  userId: number;
  isOwner: boolean;
  decorative?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const openProfile = useOpenAuthorProfile()(userId, isOwner);

  if (!openProfile) return <div className={className}>{children}</div>;

  return (
    <button
      type="button"
      tabIndex={decorative ? -1 : undefined}
      aria-hidden={decorative || undefined}
      onClick={(event) => {
        // 카드 · 행 전체 탭이 함께 반응하지 않게 끊는다.
        event.stopPropagation();
        openProfile();
      }}
      className={cn("text-left", className)}
    >
      {children}
    </button>
  );
}
