"use client";

import { useEffect, useId, useRef, useState } from "react";

import { BottomSheetFrame } from "@/features/community/presentation/bottom-sheet-frame";
import {
  COMPETITION_REGIONS,
  type CompetitionRegion,
} from "@/features/competition/domain/competition-region";
import { CloseIcon } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";

/**
 * 지역 고르기 시트 (#334) — 시·도 칩을 여러 개 골라 "적용"으로 반영한다.
 *
 * 17개 시·도는 목록 위 칩 줄에 다 놓기엔 많아 시트로 뺐다. 고른 것은 적용을 눌러야 목록에 반영된다 —
 * 칩을 누를 때마다 뒤 목록이 바뀌면 시트 너머로 깜빡인다. "전체"는 고른 걸 모두 지운다.
 * 예정 대회가 없는 시·도는 골라도 결과가 비어 흐리게 막아 둔다.
 *
 * 적용 버튼 바로 위에 고른 지역과 개수를 모아 보여 준다 — 칩 17개 사이에서 켜진 걸 눈으로 세지 않아도
 * 무엇을 적용하는지 알 수 있게. 모음 줄의 ×로도 뺄 수 있다. 고른 순서대로 쌓고, 넘치면 가로로 민다.
 *
 * 여는 상태는 호출부가 소유한다. 고르던 값(draft)은 열 때마다 새로 시작하도록 호출부가 key를 바꿔 다시 만든다.
 */
export function CompetitionRegionSheet({
  open,
  selected,
  available,
  onDismiss,
  onApply,
}: {
  open: boolean;
  selected: readonly CompetitionRegion[];
  available: readonly CompetitionRegion[];
  onDismiss: () => void;
  onApply: (regions: CompetitionRegion[]) => void;
}) {
  const [draft, setDraft] = useState<CompetitionRegion[]>(() => [...selected]);
  const trayRef = useRef<HTMLUListElement>(null);
  const allChipId = useId();
  const previousCount = useRef(draft.length);

  // 새로 고른 지역은 모음 줄 끝에 붙는다 — 넘쳐서 가려지지 않게 끝으로 밀어 보여 준다.
  useEffect(() => {
    const tray = trayRef.current;
    if (tray && draft.length > previousCount.current) {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      tray.scrollTo({
        left: tray.scrollWidth,
        behavior: reduce ? "auto" : "smooth",
      });
    }
    previousCount.current = draft.length;
  }, [draft.length]);

  const toggle = (region: CompetitionRegion) =>
    setDraft((current) =>
      current.includes(region)
        ? current.filter((value) => value !== region)
        : [...current, region],
    );

  // 모음 줄의 ×로 빼면 누른 버튼이 사라진다 — 초점이 시트 밖으로 떨어지지 않게 다음 알약(없으면 앞 알약,
  // 다 빠지면 "전체" 칩)으로 옮긴다. 다시 그린 뒤에 찾아야 해서 한 프레임 미룬다.
  const removeFromTray = (region: CompetitionRegion, index: number) => {
    const rest = draft.filter((value) => value !== region);
    const next = rest[Math.min(index, rest.length - 1)];
    toggle(region);
    requestAnimationFrame(() => {
      const target = next
        ? trayRef.current?.querySelector<HTMLElement>(
            `[data-region-pill="${next}"]`,
          )
        : document.getElementById(allChipId);
      target?.focus();
    });
  };

  return (
    <BottomSheetFrame open={open} title="지역" onDismiss={onDismiss}>
      <div className="mt-4 flex flex-wrap gap-2">
        <Chip
          id={allChipId}
          tone="primary"
          selected={draft.length === 0}
          aria-pressed={draft.length === 0}
          onClick={() => setDraft([])}
        >
          전체
        </Chip>
        {COMPETITION_REGIONS.map((region) => {
          const isSelected = draft.includes(region);
          return (
            <Chip
              key={region}
              tone="primary"
              selected={isSelected}
              aria-pressed={isSelected}
              disabled={!isSelected && !available.includes(region)}
              onClick={() => toggle(region)}
            >
              {region}
            </Chip>
          );
        })}
      </div>

      {/* 고른 지역 모음: 박스 없이 간격으로만 칩 판과 나눈다 · 높이 고정 — 고르고 뺄 때 시트 높이가 출렁이지 않게. */}
      <div className="mt-7 flex h-8 items-center gap-3">
        <span
          aria-live="polite"
          className="shrink-0 text-body-s text-text-secondary"
        >
          선택{" "}
          <span
            className={
              draft.length > 0
                ? "font-semibold text-primary"
                : "text-text-secondary"
            }
          >
            {draft.length}
          </span>
        </span>
        {draft.length === 0 ? (
          <span className="text-body-s text-text-tertiary">전체 지역</span>
        ) : (
          <ul
            ref={trayRef}
            aria-label="고른 지역"
            className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pr-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {draft.map((region, index) => (
              <li key={region} className="shrink-0">
                <button
                  type="button"
                  data-region-pill={region}
                  aria-label={`${region} 빼기`}
                  onClick={() => removeFromTray(region, index)}
                  // 보이는 알약은 28이지만 누를 자리는 위아래로 8씩 늘려 44에 맞춘다(옆 알약과는 겹치지 않게 세로만).
                  className="relative inline-flex h-7 items-center gap-0.5 rounded-full bg-surface-primary-subtle pr-1.5 pl-2.5 text-[13px] leading-none font-semibold text-primary before:absolute before:inset-x-0 before:-inset-y-2 before:content-[''] active:bg-surface-primary-subtle-pressed"
                >
                  {region}
                  <CloseIcon size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button
        variant="cta"
        size="l"
        // 표준 순서로 맞춰 넘긴다 — 칩 줄 라벨("서울 외 1")이 누른 순서에 따라 달라지지 않게.
        onClick={() =>
          onApply(
            COMPETITION_REGIONS.filter((region) => draft.includes(region)),
          )
        }
        className="mt-4 w-full"
      >
        적용
      </Button>
    </BottomSheetFrame>
  );
}
