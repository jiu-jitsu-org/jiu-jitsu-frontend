"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import type { CommentSort } from "@/features/community/domain/post";
import { cn } from "@/shared/lib/cn";
import { ChevronDownIcon } from "@/shared/ui/icons";

const SORT_OPTIONS: { value: CommentSort; label: string }[] = [
  { value: "latest", label: "최신순" },
  { value: "oldest", label: "작성된 순" },
];

/**
 * 댓글 정렬 드롭다운 (클라이언트 leaf).
 *
 * 선택 시 `?sort=`만 갱신(router.replace)해 서버가 정렬된 목록을 다시 렌더하게 한다.
 * 정렬 상태를 클라이언트에 따로 들고 있지 않아 단일 출처(URL)를 유지한다.
 */
export function CommentSortSelect({ sort }: { sort: CommentSort }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const current =
    SORT_OPTIONS.find((option) => option.value === sort) ?? SORT_OPTIONS[0];

  function selectSort(next: CommentSort) {
    setOpen(false);
    if (next === sort) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", next);
    // scroll 위치 유지 — 댓글 섹션 정렬만 바뀐다.
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="relative">
      {/* 텍스트(Button S = 12 Semibold) + chevron 16, 간격 2(gap-0.5). 높이 32, 너비 콘텐츠 맞춤.
          좌 8(pl-2)/우 4(pr-1). 색 #292A2E(토큰 미매핑 특수 케이스, 아이콘은 currentColor로 동일). */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex h-8 items-center gap-0.5 pl-2 pr-1 text-xs font-semibold text-[#292A2E]"
      >
        {current.label}
        <ChevronDownIcon size={16} />
      </button>

      {open ? (
        <>
          {/* 바깥 클릭으로 닫기 위한 투명 백드롭 */}
          <button
            type="button"
            aria-label="정렬 메뉴 닫기"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <ul
            role="listbox"
            className="absolute left-0 z-20 mt-1 min-w-24 overflow-hidden rounded-xl border border-border-default bg-surface-container py-1 shadow-lg"
          >
            {SORT_OPTIONS.map((option) => (
              <li key={option.value} role="option" aria-selected={option.value === sort}>
                <button
                  type="button"
                  onClick={() => selectSort(option.value)}
                  className={cn(
                    "block w-full px-4 py-2 text-left text-sm",
                    option.value === sort
                      ? "font-medium text-text-primary"
                      : "text-text-secondary",
                  )}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
