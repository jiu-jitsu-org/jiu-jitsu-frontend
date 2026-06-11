import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * 상단 앱바 공통 셸 — sticky 헤더의 바깥 껍데기만 공유한다(내용은 children으로 주입).
 *
 * 높이 44(h-11), 좌우 8(px-2), 배경 True White, z-30 고정.
 * pt-[env(safe-area-inset-top)] — 상태바/노치 영역을 흰 배경으로 덮으면서 콘텐츠는 그 아래로 민다.
 * (layout의 viewportFit: "cover" + 네이티브 웹뷰가 edge-to-edge여야 env 인셋이 실제 값으로 들어온다.)
 *
 * box-content(content-box) 필수 — 기본 border-box면 h-11(44px)에 패딩이 포함돼,
 * inset이 44px보다 큰 기기(다이나믹아일랜드 등)에서 44px 바가 짜부라지고 타이틀이 상태바에 붙는다.
 * content-box로 두면 h-11은 inset 패딩 "아래에 깔리는 44px 바"의 높이가 되어 전체 = inset + 44.
 *
 * 새 화면 헤더는 이 셸을 쓰면 safe-area 처리를 개별로 빠뜨릴 수 없다.
 */
export function AppBarShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 box-content flex h-11 items-center bg-[var(--bw-true-white)] px-2 pt-[env(safe-area-inset-top)]",
        className,
      )}
    >
      {children}
    </header>
  );
}
