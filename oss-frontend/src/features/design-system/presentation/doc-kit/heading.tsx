import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * 문서 안 소제목. 오른쪽 '이 문서 목차'가 data-toc가 붙은 소제목을 모아 목록을 만든다.
 * 앵커는 `문서id--소제목id`(예: `#button--anatomy`) — 앞 마디로 어느 문서를 열지 안다.
 */
export function H({
  doc,
  id,
  children,
  className,
}: {
  doc: string;
  id: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      id={`${doc}--${id}`}
      data-toc
      // 붙어 있는 위쪽 줄(모바일 문서 바)에 가리지 않게 앵커 위치를 내린다.
      className={cn("mt-14 scroll-mt-24 text-title-2 text-text-primary", className)}
    >
      {children}
    </h2>
  );
}

/** 절 안의 작은 제목 — 목차에는 넣지 않는다. */
export function Sub({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h3 className={cn("mt-8 text-title-3 text-text-primary", className)}>
      {children}
    </h3>
  );
}

/** 절 설명 문단. */
export function P({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("mt-2 text-body-s text-text-secondary", className)}>
      {children}
    </p>
  );
}

/** 클래스·토큰 이름. */
export function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-md bg-surface-field-subtle px-1 font-mono text-label-m text-text-secondary-strong">
      {children}
    </code>
  );
}
