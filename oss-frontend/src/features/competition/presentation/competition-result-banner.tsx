"use client";

import { useLoginGuard } from "@/features/community/presentation/use-login-guard";
import {
  dismissResultPrompt,
  useResultPromptDismissed,
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
 * 끝난 대회의 결과 남기기 배너 (#368).
 *
 * 맨 위(앱바 아래)에 화면 흐름 안에 놓아 읽던 내용을 가리지 않는다. ✕로 닫으면 이 기기에서 같은 대회에 다시 뜨지 않는다
 * — 대회 탭의 결과 남기기 카드(#403)와 닫은 기록을 함께 쓴다.
 * "내 기록에 남기기"는 앱의 대회 정보 추가를 이 대회로 채워 연다(jiu-jitsu-ios#252) — 결과 입력은 앱 화면이다.
 * 그래서 앱 밖 브라우저에서는 배너를 두지 않는다(위에 '앱으로 보기' 배너가 있다).
 */
export function CompetitionResultBanner({
  competitionId,
  name,
  year,
  daysAgo,
}: {
  competitionId: number;
  name: string;
  year: number;
  daysAgo: number;
}) {
  const externalBrowser = useIsExternalBrowser();
  const dismissed = useResultPromptDismissed(competitionId);
  const { guard } = useLoginGuard();
  const toast = useToast();

  if (externalBrowser || dismissed) return null;

  function leaveRecord() {
    if (openNativeCompetitionRecord({
        // 숫자 문자열로 보낸다 — 이미 깔린 앱은 문자열만 받는다(messages.ts).
        competitionId: String(competitionId),
        name,
        year,
      })) return;
    // 이 신호를 모르는 앱 — 기록하는 곳을 알려 준다.
    toast.show("MY의 대회 기록에서 남길 수 있어요", { tone: "info" });
  }

  return (
    <aside
      aria-label="대회 결과 남기기"
      className="mx-4 mt-3 flex items-start gap-2 rounded-20 bg-surface-primary-subtle py-3 pr-1.5 pl-4"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[15px] leading-[21px] font-bold text-text-primary">
          {daysAgo <= 1
            ? "어제 끝난 대회예요"
            : `${daysAgo}일 전에 끝난 대회예요`}
        </p>
        <p className="mt-0.5 text-[13px] leading-[18px] text-text-secondary">
          나가셨다면 결과를 남겨 둘까요?
        </p>
        <Button
          variant="filled"
          size="s"
          className="mt-2.5"
          onClick={guard(
            leaveRecord,
            "대회 기록은 OSS 앱에서 로그인 후 남길 수 있어요.",
          )}
        >
          내 기록에 남기기
        </Button>
      </div>
      <IconButton
        aria-label="결과 남기기 안내 닫기"
        onClick={() => dismissResultPrompt([competitionId])}
        className="-mt-1.5 flex-none text-icon-secondary"
      >
        <CloseIcon size={20} />
      </IconButton>
    </aside>
  );
}
