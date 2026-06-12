"use client";

import type { ReactNode } from "react";

import { useViewportRect } from "@/shared/lib/use-viewport-rect";

/**
 * 키보드를 인지하는 고정 높이 화면 셸.
 *
 * 뷰포트 하단에 핀되는 fixed 컬럼으로 문서 전체 스크롤을 막고, header/footer는 위아래 고정, 가운데
 * 본문(children)만 내부 스크롤시킨다. 키보드가 떠 있을 때 '실제 보이는 영역'에 셸을 정확히 맞춘다.
 *
 * 높이/위치를 dvh나 fixed inset-0가 아니라 visualViewport로 잡는 이유: 이 WKWebView에선 키보드가
 * 떠도 레이아웃 뷰포트(dvh·ICB)가 즉시 안 줄어, 셸이 키보드 뒤까지 덮어 입력창이 가려지고 끝까지
 * 스크롤이 안 된다. visualViewport는 overlay/프레임축소 무관하게 키보드 위 가시 영역을 보고하므로,
 * 그 top/height에 셸을 맞추면 footer(예: 댓글 입력 바)가 항상 키보드 바로 위에 떨어진다.
 *
 * 셸이 fixed라 문서에 오버플로가 없어 네이티브의 메인 문서 스크롤 0-락과도 충돌하지 않는다(본문은
 * 별도 내부 overflow 스크롤러). 서버 컴포넌트가 header/footer/children을 슬롯으로 넘기면 서버 렌더된다.
 */
export function KeyboardAwareShell({
  header,
  footer,
  children,
}: {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const rect = useViewportRect();

  return (
    <div
      className="fixed left-0 right-0 flex flex-col overflow-hidden bg-[var(--bw-true-white)]"
      style={
        rect
          ? { top: rect.top, height: rect.height }
          : { top: 0, height: "100dvh" }
      }
    >
      {header ? <div className="shrink-0">{header}</div> : null}
      {/* overscroll-contain: 내부 스크롤이 끝에서 문서(네이티브가 0으로 락)로 체이닝되지 않게. */}
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {children}
      </main>
      {footer ? <div className="shrink-0">{footer}</div> : null}
    </div>
  );
}
