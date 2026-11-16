import type { ReactNode } from "react";

import { DOC_GROUP_LABEL, findDoc } from "./doc-registry";

/**
 * 문서 한 장의 틀 — 머리(분류 → 제목 → 한 줄 설명 → 메타 칩) + 본문.
 *
 * 분류·제목·설명은 doc-registry의 같은 id 줄을 읽는다(사이드에 등록된 이름과 늘 같다).
 * 메타 칩에는 실제로 센 값만 넣는다 — 사용 수는 날짜를 붙인 스냅샷("2026-11-16 기준")이다.
 */
export function DocPage({
  id,
  meta = [],
  children,
}: {
  id: string;
  meta?: { label: string; value: string | number }[];
  children: ReactNode;
}) {
  const doc = findDoc(id);
  return (
    <article className="flex flex-col">
      <header className="pb-2">
        <p className="text-label-m text-primary">{DOC_GROUP_LABEL[doc.group]}</p>
        <h1 className="mt-2 text-display-1 text-text-primary">{doc.title}</h1>
        <p className="mt-2 text-body-m text-text-secondary">{doc.summary}</p>
        {meta.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {meta.map((item) => (
              <li
                key={item.label}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface-field-subtle px-3 text-label-m"
              >
                <span className="text-text-tertiary">{item.label}</span>
                <span className="text-text-primary">{item.value}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </header>
      {children}
    </article>
  );
}
