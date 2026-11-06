"use client";

import { CloseIcon, SearchIcon } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";

/**
 * 대회 이름 검색칸 (#345) — 필터 줄 오른쪽 돋보기를 누르면 필터 줄 바로 아래에 열린다.
 *
 * 제안서는 "1차는 필터 먼저"라 늘 펼쳐 두지 않고 아이콘 뒤에 접어 둔다 — 필터 줄 높이가 그대로다.
 * 입력칸 테두리는 이 화면에서 입력칸에만 쓰는 선이다. 칠 때마다 바로 거른다(서버를 부르지 않는다).
 * 엔터는 키보드만 내리고, Esc는 검색을 닫는다.
 */
export function CompetitionSearchField({
  id,
  value,
  onChange,
  onClose,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="px-4 pb-3">
      <label
        className={cn(
          "flex h-10 items-center gap-2 rounded-full border bg-textfield-default-bg px-3",
          "border-textfield-default-border focus-within:border-textfield-focused-border",
        )}
      >
        <SearchIcon
          size={18}
          className="flex-none text-textfield-default-icon"
        />
        <input
          id={id}
          type="search"
          enterKeyHint="search"
          autoFocus
          value={value}
          placeholder="대회 이름으로 찾기"
          aria-label="대회 이름 검색"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
            if (event.key === "Escape") onClose();
          }}
          // 브라우저 기본 지우기(×)는 숨기고 아래 버튼 하나만 둔다.
          className="min-w-0 flex-1 bg-transparent text-[15px] leading-[22px] text-text-primary outline-none placeholder:text-textfield-default-placeholder [&::-webkit-search-cancel-button]:hidden"
        />
        {value ? (
          <button
            type="button"
            aria-label="검색어 지우기"
            onClick={() => onChange("")}
            className="-mr-1.5 flex size-8 flex-none items-center justify-center rounded-full text-textfield-default-icon active:bg-surface-container-pressed"
          >
            <CloseIcon size={16} />
          </button>
        ) : null}
      </label>
    </div>
  );
}
