"use client";

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
 * 관심 대회가 끝난 뒤 대회 탭 배너 자리의 결과 남기기 배너 (#403).
 *
 * 곧 마감 배너와 짙은 면·✕ 자리가 같다. 왼쪽 네모는 두지 않는다 — 대회 이름이 대개 길어 그 자리를 이름에 준다.
 * 버튼은 글 아래 — 이름이 카드 너비를 다 써서 두 줄까지 보이고, 버튼 글('내 기록에 남기기')이 무엇을 하는지 말한다.
 * 버튼 글은 상세 결과 배너(#368)와 같다.
 * 연한 파란 면은 대회 탭 위쪽 띠 색 그라데이션에 묻혀 같은 자리의 곧 마감 배너와 같은 짙은 면을 쓴다.
 * 한 장에 대회 하나만 — 끝난 관심 대회가 여럿이면 배너 자리가 대회마다 한 장씩 따로 띄운다.
 * ✕는 그 대회를 닫는다(호출부가 한다) — 상세 배너(#368)와 닫은 기록을 함께 써서 두 곳 모두 다시 뜨지 않는다.
 * 앱 밖 브라우저에서는 띄우지 않는다 — '내 기록에 남기기'가 앱 화면을 여는 일이라서다(배너 자리가 거른다).
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

  // '내 기록에 남기기'를 누른 일은 로그인 안내가 떠도 남긴다(GA, #620) — 로그인 안내는 따로 기록된다.
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
      {/* 작은 글 + 굵은 대회 이름(두 줄까지), 그 아래 버튼. ✕ 자리(오른쪽 48)를 비운다. */}
      <div className="flex w-full flex-col items-start rounded-20 bg-[var(--cool-gray-900)] py-3 pr-12 pl-4 text-text-on-dark">
        <span className="text-[12px] leading-[16px] text-[var(--opacity-white-60)]">
          {endedLabel(group.daysAgo)} 관심 대회
        </span>
        <span className="line-clamp-2 text-[16px] leading-[22px] font-bold break-keep">
          {only.name}
        </span>
        <Button
          variant="filled"
          size="s"
          className="mt-2.5"
          aria-label={`${only.name} 결과를 내 기록에 남기기`}
          onClick={pressRecord(only)}
        >
          내 기록에 남기기
        </Button>
      </div>
      <IconButton
        size="l"
        aria-label="결과 남기기 안내 닫기"
        onClick={onClose}
        className={`${BANNER_CLOSE_POSITION} text-[var(--opacity-white-60)] active:bg-[var(--opacity-white-20)]`}
      >
        <CloseIcon size={20} />
      </IconButton>
    </aside>
  );
}

/** "어제 끝난" · "3일 전에 끝난". */
function endedLabel(daysAgo: number) {
  return daysAgo <= 1 ? "어제 끝난" : `${daysAgo}일 전에 끝난`;
}
