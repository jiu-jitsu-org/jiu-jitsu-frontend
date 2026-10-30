"use client";

import { useState, type ReactNode } from "react";

import {
  BELT_GRAUS,
  BELT_RANKS,
  type Belt,
  type BeltGrau,
  type BeltRank,
} from "@/features/community/domain/belt";
import { Avatar } from "@/features/community/presentation/avatar";
import { BELT_COLOR, BeltAvatar } from "@/features/community/presentation/belt-avatar";
import { BottomSheetFrame } from "@/features/community/presentation/bottom-sheet-frame";
import { cn } from "@/shared/lib/cn";
import { PRESS_BOUNCE } from "@/shared/ui/press-styles";

const RANK_LABEL: Record<BeltRank, string> = {
  white: "화이트",
  blue: "블루",
  purple: "퍼플",
  brown: "브라운",
  black: "블랙",
};

const GRAU_LABEL: Record<BeltGrau, string> = {
  0: "무그랄",
  1: "1그랄",
  2: "2그랄",
  3: "3그랄",
  4: "4그랄",
};

/**
 * 띠 묻기 바텀시트 (#275) — "글 옆에 내 띠를 보여 줄까요?"
 *
 * 필수 입력이 아니라 계기마다 가볍게 묻는다(#270). 체급은 묻지 않는다 — 공개를 망설이는 정보라서.
 * 고르는 동안 위쪽 사진에 고른 띠가 그대로 그려져, 저장하면 글 옆에 어떻게 보일지 미리 보인다.
 *
 * 여는 상태·저장은 호출부(BeltPromptProvider)가 소유한다. 그랄은 무그랄로 시작한다.
 */
export function BeltPromptSheet({
  open,
  saving,
  onSave,
  onLater,
}: {
  open: boolean;
  saving: boolean;
  onSave: (belt: Belt) => void;
  /** '나중에' 버튼과 바깥 탭 모두 여기로 온다. */
  onLater: () => void;
}) {
  const [rank, setRank] = useState<BeltRank | null>(null);
  const [grau, setGrau] = useState<BeltGrau>(0);

  const photo = <Avatar className="size-full" iconSize={32} />;

  return (
    <BottomSheetFrame
      open={open}
      title="글 옆에 내 띠를 보여 줄까요?"
      message="띠가 보이면 답하는 사람이 내 수준에 맞춰 답해 줘요"
      onDismiss={onLater}
    >
      {/* 미리보기: 띠를 고르기 전엔 글 옆과 같은 회색 점선. */}
      <div className="mt-5 flex justify-center">
        <BeltAvatar belt={rank ? { rank, grau } : null} size="large">
          {photo}
        </BeltAvatar>
      </div>

      <ChipGroup label="띠">
        {BELT_RANKS.map((value) => (
          <Chip
            key={value}
            selected={rank === value}
            onSelect={() => setRank(value)}
            className="h-[60px] flex-col gap-1.5 rounded-[12px]"
          >
            <BeltSwatch rank={value} />
            {RANK_LABEL[value]}
          </Chip>
        ))}
      </ChipGroup>

      <ChipGroup label="그랄">
        {BELT_GRAUS.map((value) => (
          <Chip
            key={value}
            selected={grau === value}
            onSelect={() => setGrau(value)}
            className="h-8 rounded-full"
          >
            {GRAU_LABEL[value]}
          </Chip>
        ))}
      </ChipGroup>

      {/* 하단 CTA: SelectSheet와 같은 높이 51 · radius 15. 띠를 고르기 전에는 저장할 수 없다. */}
      <button
        type="button"
        disabled={!rank || saving}
        onClick={() => (rank ? onSave({ rank, grau }) : undefined)}
        className={cn(
          "mt-6 h-[51px] w-full rounded-[15px] bg-cta-primary-bg text-button-m text-cta-primary-text disabled:bg-cta-primary-disabled-bg disabled:text-cta-primary-disabled-text",
          "enabled:active:bg-cta-primary-pressed-bg",
          PRESS_BOUNCE,
        )}
      >
        저장
      </button>
      <button
        type="button"
        disabled={saving}
        onClick={onLater}
        className={cn(
          "mt-2 h-[51px] w-full rounded-[15px] bg-cta-transparent-text-bg text-button-m text-cta-transparent-text-text disabled:text-cta-transparent-text-disabled-text",
          "enabled:active:bg-cta-transparent-text-pressed-bg",
          PRESS_BOUNCE,
        )}
      >
        나중에
      </button>
    </BottomSheetFrame>
  );
}

/** 띠·그랄 모두 5개라 한 줄 5칸으로 나눈다 — 좁은 폰에서도 두 줄로 넘어가지 않는다. */
function ChipGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-5">
      <p className="text-body-s font-medium text-text-secondary">{label}</p>
      <div role="radiogroup" aria-label={label} className="mt-2 grid grid-cols-5 gap-2">
        {children}
      </div>
    </div>
  );
}

/** 글쓰기 카테고리 칩과 같은 테두리·선택 색(chip/selected). 모양(높이·모서리)은 호출부가 정한다. */
function Chip({
  selected,
  onSelect,
  className,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  className: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "inline-flex min-w-0 items-center justify-center border px-1 text-button-s text-tag-chip-default-text transition-colors",
        selected
          ? "border-chip-selected-border bg-tag-chip-selected-bg"
          : "border-chip-default-border bg-tag-chip-default-bg active:bg-surface-container-pressed",
        "motion-safe:active:scale-96",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** 띠 그림 — 띠 색 바탕에 끝 검은 칸(검은띠는 빨간 칸). 띠 아바타(BeltAvatar)의 띠 끝과 같은 색 규칙. */
function BeltSwatch({ rank }: { rank: BeltRank }) {
  return (
    <span
      aria-hidden="true"
      className="relative h-2.5 w-8 overflow-hidden rounded-[3px] border border-chip-default-border"
      style={{ background: BELT_COLOR[rank] }}
    >
      <span
        className="absolute inset-y-0 right-1.5 w-2"
        style={{ background: rank === "black" ? "var(--red-500)" : "var(--bw-black)" }}
      />
    </span>
  );
}
