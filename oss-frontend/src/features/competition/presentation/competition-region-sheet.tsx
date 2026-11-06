"use client";

import { useState } from "react";

import { BottomSheetFrame } from "@/features/community/presentation/bottom-sheet-frame";
import {
  COMPETITION_REGIONS,
  type CompetitionRegion,
} from "@/features/competition/domain/competition-region";
import { Button } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";

/**
 * 지역 고르기 시트 (#334) — 시·도 칩을 여러 개 골라 "적용"으로 반영한다.
 *
 * 17개 시·도는 목록 위 칩 줄에 다 놓기엔 많아 시트로 뺐다. 고른 것은 적용을 눌러야 목록에 반영된다 —
 * 칩을 누를 때마다 뒤 목록이 바뀌면 시트 너머로 깜빡인다. "전체"는 고른 걸 모두 지운다.
 * 예정 대회가 없는 시·도는 골라도 결과가 비어 흐리게 막아 둔다.
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

  const toggle = (region: CompetitionRegion) =>
    setDraft((current) =>
      current.includes(region)
        ? current.filter((value) => value !== region)
        : [...current, region],
    );

  return (
    <BottomSheetFrame open={open} title="지역" onDismiss={onDismiss}>
      <div className="mt-4 flex flex-wrap gap-2">
        <Chip
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

      <Button
        variant="cta"
        size="l"
        // 표준 순서로 맞춰 넘긴다 — 칩 줄 라벨("서울 외 1")이 누른 순서에 따라 달라지지 않게.
        onClick={() =>
          onApply(COMPETITION_REGIONS.filter((region) => draft.includes(region)))
        }
        className="mt-6 w-full"
      >
        적용
      </Button>
    </BottomSheetFrame>
  );
}
