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
import { CloseIcon, EditIcon } from "@/shared/ui/icons";

/**
 * 관심 대회가 끝난 뒤 대회 탭 배너 자리의 결과 남기기 배너 (#403).
 *
 * 곧 마감 배너와 짜임(네모·두 줄 글·✕ 자리)과 짙은 면이 같고, '남기기' 버튼을 더한다.
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

  // '남기기'를 누른 일은 로그인 안내가 떠도 남긴다(GA, #620) — 로그인 안내는 따로 기록된다.
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
      {/* 곧 마감 배너와 같은 짜임 — 왼쪽 44 네모, 작은 글 + 굵은 대회 이름, ✕ 자리(오른쪽 48)를 비운다.
          할 일이 있는 배너라 이름 오른쪽에 '남기기' 버튼을 둬 바로 누르게 한다. */}
      <div className="flex w-full items-center gap-3 rounded-20 bg-[var(--cool-gray-900)] py-3 pr-12 pl-4 text-text-on-dark">
        <span
          aria-hidden
          className="flex size-11 flex-none items-center justify-center rounded-10 bg-[var(--opacity-white-20)]"
        >
          <EditIcon size={20} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[12px] leading-[16px] text-[var(--opacity-white-60)]">
            {endedLabel(group.daysAgo)} 관심 대회
          </span>
          <span className="truncate text-[16px] leading-[22px] font-bold">
            {only.name}
          </span>
        </span>
        <Button
          variant="filled"
          size="s"
          className="flex-none"
          aria-label={`${only.name} 결과 남기기`}
          onClick={pressRecord(only)}
        >
          남기기
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
