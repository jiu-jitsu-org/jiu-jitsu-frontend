"use client";

import { useEffect, useState } from "react";

import { useLoginGuard } from "@/features/community/presentation/use-login-guard";
import type { Competition } from "@/features/competition/domain/competition";
import type { ResultCardGroup } from "@/features/competition/domain/competition-result-prompt";
import { trackBannerClick } from "@/features/competition/presentation/competition-analytics";
import { BANNER_CLOSE_POSITION } from "@/features/competition/presentation/competition-interest-banner";
import { useCloseResultPromptOnRecord } from "@/features/competition/presentation/use-close-result-prompt-on-record";
import { openNativeCompetitionRecord } from "@/shared/lib/native-bridge";
import { useToast } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";
import { CloseIcon } from "@/shared/ui/icons";

/**
 * 관심 대회가 끝난 뒤 대회 탭 배너 자리의 결과 남기기 자리 (#403).
 *
 * 다른 배너(곧 마감·곧 열려요)와 달리 짙은 카드를 두지 않는다 — 대회 탭 위쪽 띠 색 그라데이션이 그대로 흐르는 위에
 * 가운데 맞춤으로 작은 글 · 굵은 대회 이름(두 줄까지) · 2·1·3 단상 · 꽉 찬 파란 버튼을 쌓는다.
 * 단상 면이 옅은 금·은·동이라 '순위를 남긴다'가 글 없이 읽히고, 아래로 갈수록 바탕에 녹는다.
 * 단상은 처음 보일 때 한 번, 버튼(바닥) 아래에서 2 → 1 → 3 순서로 솟으며 살짝 튄다(움직임 줄이기면 서 있는 채로).
 * 자리가 다른 배너보다 높아, 그라데이션도 이 자리가 떠 있는 동안 길게 깐다(CompetitionTopTint의 tall).
 * ✕ 자리는 다른 배너와 같다(BANNER_CLOSE_POSITION) — 배너가 번갈아 떠도 닫는 곳이 같다. 카드가 없어 흰 동그라미 위에 둔다.
 * 한 장에 대회 하나만 — 끝난 관심 대회가 여럿이면 배너 자리가 대회마다 한 장씩 따로 띄운다.
 * ✕는 그 대회를 닫는다(호출부가 한다) — 처음 닫으면 그날만, 다음 날 다시 떠서 또 닫으면 그 대회는 더 뜨지 않는다.
 * 상세 배너(#368)와 닫은 기록을 함께 써서 두 곳이 같이 숨는다.
 * 앱 밖 브라우저에서는 띄우지 않는다 — 버튼이 앱 화면을 여는 일이라서다(배너 자리가 거른다).
 * 이미 내 대회 기록에 남긴 대회는 서버가 빼고, 띄운 뒤 앱에서 기록을 남기면 바로 닫는다(#545).
 */
export function CompetitionResultCard({
  group,
  onClose,
}: {
  group: ResultCardGroup;
  onClose: () => void;
}) {
  const { guard } = useLoginGuard();
  const toast = useToast();
  useCloseResultPromptOnRecord();
  const [only] = group.competitions;
  // 같은 문서에서 다시 그려질 때(웹에서 상세에 갔다 돌아옴 등)는 단상을 다시 솟게 하지 않는다.
  const [rise] = useState(() => !risenIds.has(only.id));
  useEffect(() => {
    risenIds.add(only.id);
  }, [only.id]);

  function leaveRecord({ id, name, date }: Competition) {
    if (
      openNativeCompetitionRecord({
        // 숫자 문자열로 보낸다 — 이미 깔린 앱은 문자열만 받는다(messages.ts).
        competitionId: String(id),
        name,
        year: Number(date.slice(0, 4)),
      })
    ) {
      return;
    }
    // 이 신호를 모르는 앱 — 기록하는 곳을 알려 준다.
    toast.show("MY의 대회 기록에서 남길 수 있어요", { tone: "info" });
  }

  // '내 결과 남기기'를 누른 일은 로그인 안내가 떠도 남긴다(GA, #620) — 로그인 안내는 따로 기록된다.
  const pressRecord = (competition: Competition) => {
    const record = guard(
      () => leaveRecord(competition),
      "record",
      "대회 기록은 OSS 앱에서 로그인 후 남길 수 있어요.",
    );
    return () => {
      trackBannerClick(
        { banner: "result", competitionId: competition.id },
        "record",
      );
      record();
    };
  };

  return (
    <aside aria-label="대회 결과 남기기" className="relative">
      {/* 좌우는 바깥 자리(16) + 8 = 24. 단상 아래 끝이 버튼 위 끝과 맞닿는다. */}
      <div className="flex w-full flex-col items-center px-2 pt-4.5 pb-3.5 text-center">
        <span className="text-[15px] leading-[20px] tracking-[-0.01em] text-text-tertiary">
          {endedLabel(group.daysAgo)} 관심 대회
        </span>
        <span className="mt-1.5 line-clamp-2 max-w-[300px] text-[20px] leading-[27px] font-bold tracking-[-0.02em] text-balance break-keep text-text-primary [overflow-wrap:anywhere]">
          {only.name}
        </span>
        {/* 단상 — 아래를 잘라 바닥에서 솟는 것처럼 보이게 한다. 위 여백(14)은 솟을 때 넘치는 몫이다. */}
        <div
          aria-hidden
          className="mt-0.5 flex h-[90px] items-end justify-center gap-1 overflow-hidden pt-3.5"
        >
          {PODIUM.map((step) => (
            <span
              key={step.place}
              className={`flex w-14 justify-center rounded-t-10 text-[18px] leading-[22px] font-bold tracking-[-0.02em] tabular-nums${
                rise ? " motion-safe:animate-podium-rise" : ""
              }`}
              style={{
                height: step.height,
                paddingTop: step.place === 3 ? 4 : 7,
                background: `linear-gradient(180deg, ${step.top} 0%, ${step.face} 55%, color-mix(in srgb, ${step.face} 55%, transparent) 100%)`,
                boxShadow:
                  "inset 0 1px 0 color-mix(in srgb, var(--bw-true-white) 90%, transparent)",
                color: step.ink,
                animationDelay: `${PODIUM_RISE_DELAY + step.order * PODIUM_RISE_STAGGER}ms`,
              }}
            >
              {step.place}
            </span>
          ))}
        </div>
        <Button
          variant="filled"
          size="m"
          className="w-full rounded-full"
          aria-label={`${only.name} 내 결과 남기기`}
          onClick={pressRecord(only)}
        >
          내 결과 남기기
        </Button>
      </div>
      <IconButton
        size="l"
        aria-label="결과 남기기 안내 닫기"
        onClick={onClose}
        className={`${BANNER_CLOSE_POSITION} text-icon-tertiary`}
      >
        <span className="flex size-[22px] items-center justify-center rounded-full bg-[var(--opacity-white-80)]">
          <CloseIcon size={16} />
        </span>
      </IconButton>
    </aside>
  );
}

/** 이 문서에서 단상이 이미 솟은 대회. */
const risenIds = new Set<number>();

/**
 * 단상 2·1·3 — 높이, 면(위 밝은 금속빛 → 55%에서 제 색 → 아래로 바탕에 녹음), 숫자 색.
 * 금·은·동은 토큰 섞음이다(따로 둔 금속 색 토큰이 없다). order는 솟는 순서(2 → 1 → 3).
 */
const PODIUM = [
  {
    place: 2,
    order: 0,
    height: 46,
    top: "color-mix(in srgb, var(--blue-50) 20%, var(--bw-true-white))",
    face: "color-mix(in srgb, var(--blue-75) 15%, var(--cool-gray-50))",
    ink: "var(--cool-gray-500)",
  },
  {
    place: 1,
    order: 1,
    height: 66,
    top: "color-mix(in srgb, var(--yellow-400) 18%, var(--bw-true-white))",
    face: "color-mix(in srgb, var(--yellow-400) 35%, var(--cool-gray-25))",
    ink: "color-mix(in srgb, var(--yellow-400) 50%, var(--cool-gray-800))",
  },
  {
    place: 3,
    order: 2,
    height: 30,
    top: "color-mix(in srgb, var(--orange-500) 13%, var(--bw-true-white))",
    face: "color-mix(in srgb, var(--orange-500) 27%, var(--cool-gray-25))",
    ink: "color-mix(in srgb, var(--orange-500) 45%, var(--cool-gray-700))",
  },
] as const;

/** 배너 자리가 내려오며 짙어지는 동안(0.5초) 반쯤 보인 뒤에 솟기 시작한다. */
const PODIUM_RISE_DELAY = 200;
/** 단상 사이 늦춤 — 2 → 1 → 3이 한 박자로 이어진다. */
const PODIUM_RISE_STAGGER = 80;

/** "어제 끝난" · "3일 전에 끝난". */
function endedLabel(daysAgo: number) {
  return daysAgo <= 1 ? "어제 끝난" : `${daysAgo}일 전에 끝난`;
}
