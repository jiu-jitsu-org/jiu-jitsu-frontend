import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * 서브뷰 화면 스크롤 셸 — 문서 대신 이 셸이 스크롤된다(#200).
 *
 * 앱은 OPEN_SUBVIEW로 여는 웹뷰의 메인 문서 스크롤을 0으로 고정한다(iOS `locksDocumentScroll` —
 * 키보드가 문서를 밀어 올려 헤더가 화면 밖으로 나가는 것을 막는다). 그래서 문서가 스크롤되는 화면은
 * 앱에서 스크롤바만 보이고 움직이지 않는다. 뷰포트에 고정한 셸이 스스로 스크롤하면 문서엔 오버플로가
 * 없어 그 고정과 충돌하지 않는다. 앱바(AppBarShell)는 sticky라 이 셸 안에서도 위에 붙는다.
 *
 * 입력창이 있는 화면은 키보드 위 가시 영역에 맞춰야 하므로 KeyboardAwareShell을 쓴다. 이 셸은 입력이
 * 없는 목록 화면(알림함 · 커뮤니티 활동)용이라 뷰포트 전체(fixed inset-0)를 그대로 쓴다.
 *
 * overscroll-contain: 끝에서 문서로 스크롤이 이어지지 않게 한다.
 */
export function SubviewScrollShell({
  className,
  children,
}: {
  /** 화면 바탕색 등. */
  className?: string;
  children: ReactNode;
}) {
  return (
    <main
      className={cn(
        "fixed inset-0 overflow-y-auto overscroll-contain",
        className,
      )}
    >
      {children}
    </main>
  );
}
