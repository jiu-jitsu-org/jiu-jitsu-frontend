"use client";

import { useLoginGuard } from "@/features/community/presentation/use-login-guard";
import type { Competition } from "@/features/competition/domain/competition";
import { daysBetween } from "@/features/competition/domain/competition-registration";
import type { ResultCardGroup } from "@/features/competition/domain/competition-result-prompt";
import {
  dismissResultPrompt,
  useOpenResultPromptIds,
} from "@/features/competition/presentation/competition-result-dismissed";
import {
  openNativeCompetitionRecord,
  useIsExternalBrowser,
} from "@/shared/lib/native-bridge";
import { useToast } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";
import { CloseIcon } from "@/shared/ui/icons";

/**
 * 대회 탭 맨 위 결과 남기기 카드에 띄울 한 장 (#403) — 최근 순 묶음 중 이 기기에서 닫지 않은 대회가 남은 첫 묶음.
 * 묶음 안에서 닫은 대회·지금은 관심이 아닌 대회는 뺀다(상세에서 하나만 닫거나 관심을 껐을 수 있다). 없으면 null.
 * 앱 밖 브라우저에서는 띄우지 않는다 — '내 기록에 남기기'가 앱 화면을 여는 일이라서다(상세 배너와 같다).
 */
export function useResultCardGroup(
  groups: readonly ResultCardGroup[],
  interestedIds: ReadonlySet<string>,
): ResultCardGroup | null {
  const externalBrowser = useIsExternalBrowser();
  const openIds = useOpenResultPromptIds(
    groups.flatMap((group) => group.competitions.map(({ id }) => id)),
  );
  if (externalBrowser || !openIds) return null;
  const open = new Set(openIds.split(","));
  for (const group of groups) {
    // 서버가 그린 뒤 이 화면이나 상세에서 관심을 끈 대회는 묻지 않는다 — 지금 관심 목록과 한 번 더 맞춘다.
    const competitions = group.competitions.filter(
      ({ id }) => open.has(id) && interestedIds.has(id),
    );
    const latest = competitions.at(-1);
    if (!latest) continue;
    // 묶음의 '며칠 전'은 가장 늦게 끝난 대회 기준이다. 그 대회를 닫아 빠졌으면 남은 마지막 대회로 다시 센다
    // — 토·일 묶음에서 일요일 대회만 닫으면 토요일 대회가 '어제 끝난'으로 보이지 않게.
    const original = group.competitions.at(-1) ?? latest;
    return {
      ...group,
      competitions,
      daysAgo: group.daysAgo + daysBetween(latest.date, original.date),
    };
  }
  return null;
}

/**
 * 관심 대회가 끝난 뒤 대회 탭 맨 위의 결과 남기기 카드 (#403).
 *
 * 곧 마감 배너(#396)와 같은 자리에 한 번에 한 장 — 둘 다 있으면 마감을 먼저 띄운다(호출부가 정한다).
 * 모양은 일부러 마감 배너와 다르게, 끝난 대회 상세의 결과 남기기 배너(#368)와 같은 질문 + 버튼 카드다.
 * 마감은 알리는 정보 카드, 이건 묻는 카드라서다.
 * 같은 주말에 끝난 관심 대회가 여럿이면 한 장에 대회마다 줄을 두고 줄마다 남기기 버튼을 단다.
 * ✕는 카드 속 대회를 모두 닫는다 — 상세 배너와 닫은 기록을 함께 써서 두 곳 모두 다시 뜨지 않는다.
 */
export function CompetitionResultCard({ group }: { group: ResultCardGroup }) {
  const { guard } = useLoginGuard();
  const toast = useToast();
  const [only] = group.competitions;
  const single = group.competitions.length === 1;

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
    <aside
      aria-label="대회 결과 남기기"
      className="mx-4 mb-3 flex items-start gap-2 rounded-20 bg-surface-primary-subtle py-3 pr-1.5 pl-4"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[15px] leading-[21px] font-bold text-text-primary">
          {single
            ? `${endedLabel(group)} ${only.name}`
            : `${endedLabel(group)} 관심 대회 ${group.competitions.length}개`}
        </p>
        <p className="mt-0.5 text-[13px] leading-[18px] text-text-secondary">
          나가셨다면 결과를 남겨 둘까요?
        </p>
        {single ? (
          <Button
            variant="filled"
            size="s"
            className="mt-2.5"
            onClick={pressRecord(only)}
          >
            내 기록에 남기기
          </Button>
        ) : (
          <ul className="mt-2.5 flex flex-col gap-2">
            {group.competitions.map((competition) => (
              <li key={competition.id} className="flex items-center gap-3">
                <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] font-semibold text-text-primary">
                  {competition.name}
                </span>
                <Button
                  variant="filled"
                  size="s"
                  aria-label={`${competition.name} 결과 남기기`}
                  onClick={pressRecord(competition)}
                >
                  남기기
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <IconButton
        aria-label="결과 남기기 안내 닫기"
        onClick={() =>
          dismissResultPrompt(group.competitions.map(({ id }) => id))
        }
        className="-mt-1.5 flex-none text-icon-secondary"
      >
        <CloseIcon size={20} />
      </IconButton>
    </aside>
  );
}

/** "어제 끝난" · "3일 전에 끝난" · 같은 주말 여럿이면 "지난 주말에 끝난". */
function endedLabel({ weekend, daysAgo, competitions }: ResultCardGroup) {
  if (weekend && competitions.length > 1) return "지난 주말에 끝난";
  return daysAgo <= 1 ? "어제 끝난" : `${daysAgo}일 전에 끝난`;
}
