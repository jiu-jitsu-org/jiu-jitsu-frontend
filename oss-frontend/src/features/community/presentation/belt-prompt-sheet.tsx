"use client";

import { useState } from "react";

import {
  BELT_GRAUS,
  BELT_RANKS,
  type Belt,
  type BeltGrau,
  type BeltRank,
} from "@/features/community/domain/belt";
import { Avatar } from "@/features/community/presentation/avatar";
import { BeltAvatar } from "@/features/community/presentation/belt-avatar";
import { BottomSheetFrame } from "@/features/community/presentation/bottom-sheet-frame";
import { WheelPicker } from "@/features/community/presentation/wheel-picker";
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

/** 휠은 위가 높은 띠·많은 그랄 — 앱 휠(BeltRank·BeltStripe allCases.reversed())과 같은 순서. */
const RANKS_TOP_DOWN = [...BELT_RANKS].reverse();
const GRAUS_TOP_DOWN = [...BELT_GRAUS].reverse();

/**
 * 띠 묻기 바텀시트 (#275) — "글 옆에 내 띠를 보여 줄까요?"
 *
 * 필수 입력이 아니라 계기마다 가볍게 묻는다(#270). 체급은 묻지 않는다 — 공개를 망설이는 정보라서.
 * 고르는 동안 위쪽 사진에 고른 띠가 그대로 그려져, 저장하면 글 옆에 어떻게 보일지 미리 보인다.
 *
 * 띠·그랄은 좌우 휠 두 개로 고른다(#300) — 앱의 같은 시트(벨트 묻기)·MY 벨트 시트와 같은 휠·같은 순서
 * (위가 높은 띠·많은 그랄). 휠은 늘 한 칸을 가리키므로 화이트·무그랄에서 시작하고, 바로 저장할 수 있다(앱과 같다).
 *
 * 여는 상태·저장은 호출부(BeltPromptProvider)가 소유한다. 고른 값은 시트 속(BeltPromptBody)이 갖는다 —
 * 시트가 닫히면 속이 언마운트되므로, 다시 열 때마다 화이트·무그랄에서 새로 시작한다.
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
  return (
    <BottomSheetFrame
      open={open}
      title="글 옆에 내 띠를 보여 줄까요?"
      message="띠가 보이면 답하는 사람이 내 수준에 맞춰 답해 줘요"
      onDismiss={onLater}
    >
      <BeltPromptBody saving={saving} onSave={onSave} onLater={onLater} />
    </BottomSheetFrame>
  );
}

function BeltPromptBody({
  saving,
  onSave,
  onLater,
}: {
  saving: boolean;
  onSave: (belt: Belt) => void;
  onLater: () => void;
}) {
  const [rank, setRank] = useState<BeltRank>("white");
  const [grau, setGrau] = useState<BeltGrau>(0);

  const photo = <Avatar className="size-full" iconSize={32} />;

  return (
    <>
      {/* 미리보기: 휠이 가리키는 띠·그랄을 굴리는 대로 바로 그린다. */}
      <div className="mt-5 flex justify-center">
        <BeltAvatar belt={{ rank, grau }} size="large">
          {photo}
        </BeltAvatar>
      </div>

      {/* 좌우 휠: 왼쪽 띠 · 오른쪽 그랄, 사이 24, 가운데 정렬(앱 BeltPromptView와 같은 배치). */}
      <div className="mt-6 flex justify-center gap-6">
        <WheelPicker
          label="띠"
          items={RANKS_TOP_DOWN}
          value={rank}
          getLabel={(value) => RANK_LABEL[value]}
          onChange={setRank}
        />
        <WheelPicker
          label="그랄"
          items={GRAUS_TOP_DOWN}
          value={grau}
          getLabel={(value) => GRAU_LABEL[value]}
          onChange={setGrau}
        />
      </div>

      {/* 하단 CTA: SelectSheet와 같은 높이 51 · radius 15. */}
      <button
        type="button"
        disabled={saving}
        onClick={() => onSave({ rank, grau })}
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
    </>
  );
}
