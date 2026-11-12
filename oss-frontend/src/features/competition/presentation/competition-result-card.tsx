"use client";

import { useLoginGuard } from "@/features/community/presentation/use-login-guard";
import type { Competition } from "@/features/competition/domain/competition";
import type { ResultCardGroup } from "@/features/competition/domain/competition-result-prompt";
import { BANNER_CLOSE_POSITION } from "@/features/competition/presentation/competition-interest-banner";
import { openNativeCompetitionRecord } from "@/shared/lib/native-bridge";
import { useToast } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";
import { CloseIcon, EditIcon } from "@/shared/ui/icons";

/**
 * 관심 대회가 끝난 뒤 대회 탭 배너 자리의 결과 남기기 배너 (#403).
 *
 * 곧 마감 배너와 짜임(네모·두 줄 글·✕ 자리)이 같고, 밝은 면에 '남기기' 버튼을 더한다.
 * 한 장에 대회 하나만 — 끝난 관심 대회가 여럿이면 배너 자리가 대회마다 한 장씩 따로 띄운다.
 * ✕는 그 대회를 닫는다(호출부가 한다) — 상세 배너(#368)와 닫은 기록을 함께 써서 두 곳 모두 다시 뜨지 않는다.
 * 앱 밖 브라우저에서는 띄우지 않는다 — '내 기록에 남기기'가 앱 화면을 여는 일이라서다(배너 자리가 거른다).
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
  const [only] = group.competitions;

  function leaveRecord({ id, name, date }: Competition) {
    if (
      openNativeCompetitionRecord({
        competitionId: id,
        name,
        year: Number(date.slice(0, 4)),
      })
    ) {
      return;
    }
    // 이 신호를 모르는 앱 — 기록하는 곳을 알려 준다.
    toast.show("MY의 대회 기록에서 남길 수 있어요", { tone: "info" });
  }

  const pressRecord = (competition: Competition) =>
    guard(
      () => leaveRecord(competition),
      "대회 기록은 OSS 앱에서 로그인 후 남길 수 있어요.",
    );

  return (
    <aside aria-label="대회 결과 남기기" className="relative">
      {/* 곧 마감 배너와 같은 짜임 — 왼쪽 44 네모, 작은 글 + 굵은 대회 이름, ✕ 자리(오른쪽 48)를 비운다.
          할 일이 있는 배너라 이름 오른쪽에 '남기기' 버튼을 둬 바로 누르게 한다. */}
      <div className="flex w-full items-center gap-3 rounded-20 bg-surface-primary-subtle py-3 pr-12 pl-4">
        <span
          aria-hidden
          className="flex size-11 flex-none items-center justify-center rounded-10 bg-surface-container text-primary"
        >
          <EditIcon size={20} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[12px] leading-[16px] text-text-secondary">
            {endedLabel(group.daysAgo)} 관심 대회
          </span>
          <span className="truncate text-[16px] leading-[22px] font-bold text-text-primary">
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
        className={`${BANNER_CLOSE_POSITION} text-icon-secondary`}
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
