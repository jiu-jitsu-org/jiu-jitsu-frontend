"use client";

import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";
import { CloseIcon } from "@/shared/ui/icons";

/**
 * 최근 검색 (#591) — 검색 화면의 처음 모습. 이 기기에서 찾은 말을 최근 것부터 10개까지 보인다.
 *
 * 줄을 누르면 그 말로 다시 찾고, 오른쪽 ×는 그 줄만, '전체 지우기'는 모두 지운다.
 * 없으면 아무것도 그리지 않는다(검색칸만). 하이드레이션 전(null)도 마찬가지 — 저장소는 브라우저에만 있다.
 * 줄 사이 구분선 없이 높이(44)와 누르는 동안의 옅은 면으로만 가른다.
 */
export function PostSearchRecent({
  recent,
  onSelect,
  onRemove,
  onClear,
}: {
  recent: readonly string[] | null;
  onSelect: (keyword: string) => void;
  onRemove: (keyword: string) => void;
  onClear: () => void;
}) {
  if (!recent || recent.length === 0) return null;

  return (
    <section
      aria-labelledby="post-search-recent-title"
      className="px-4 pt-3 motion-safe:animate-fade-in"
    >
      <div className="flex h-8 items-center justify-between">
        <h2
          id="post-search-recent-title"
          className="text-body-s font-semibold text-text-secondary"
        >
          최근 검색
        </h2>
        {/* 글자 버튼 — 지우기는 주된 동작이 아니라 파랑 대신 제목과 같은 회색. 면 여백은 음수 마진으로 상쇄해 글자를 오른쪽 16에 맞춘다. */}
        <Button
          variant="text"
          size="s"
          data-ga="recent_clear"
          onClick={onClear}
          className="-mr-3 text-body-s text-text-secondary"
        >
          전체 지우기
        </Button>
      </div>
      <ul className="mt-1">
        {recent.map((keyword) => (
          <li key={keyword} className="flex items-center">
            {/* 누르는 면은 글자 바깥으로 좌 8 넓힌다(카드 눌림 면과 같은 방식) — 글자는 화면 좌 16에 그대로. */}
            <button
              type="button"
              onClick={() => onSelect(keyword)}
              className="-ml-2 h-11 min-w-0 flex-1 truncate rounded-10 pl-2 text-left text-body-m text-text-primary motion-safe:transition-colors motion-safe:duration-120 active:bg-surface-container-pressed"
            >
              {keyword}
            </button>
            {/* ×: 보이는 아이콘 16, 누를 자리 36. 오른쪽 끝을 '전체 지우기' 글자 끝과 맞춘다. */}
            <IconButton
              size="s"
              data-ga="recent_remove"
              onClick={() => onRemove(keyword)}
              aria-label={`'${keyword}' 최근 검색에서 지우기`}
              className="-mr-2.5 text-icon-tertiary"
            >
              <CloseIcon size={16} />
            </IconButton>
          </li>
        ))}
      </ul>
    </section>
  );
}
