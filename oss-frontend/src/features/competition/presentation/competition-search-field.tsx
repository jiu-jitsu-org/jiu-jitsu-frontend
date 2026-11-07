"use client";

import { SearchField } from "@/shared/ui";

/**
 * 대회 이름 검색칸 (#345) — 필터 줄 오른쪽 돋보기를 누르면 필터 줄 바로 아래에 열린다.
 *
 * 제안서는 "1차는 필터 먼저"라 늘 펼쳐 두지 않고 아이콘 뒤에 접어 둔다 — 필터 줄 높이가 그대로다.
 * 모양은 공통 부품 `SearchField`가 맡는다. 칠 때마다 바로 거른다(서버를 부르지 않는다).
 * 엔터는 키보드만 내리고, Esc는 검색을 닫는다.
 * 열릴 때 돋보기 쪽 위에서 살짝 내려오며 나타난다(0.5초, 동작 줄이기 설정이면 바로).
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
    <div className="origin-top px-4 pb-3 motion-safe:animate-search-drop-in">
      <SearchField
        id={id}
        autoFocus
        value={value}
        onValueChange={onChange}
        onEscape={onClose}
        placeholder="대회 이름으로 찾기"
        aria-label="대회 이름"
      />
    </div>
  );
}
