"use client";

import { useSyncExternalStore } from "react";

import { useLoginGuard } from "@/features/community/presentation/use-login-guard";
import {
  openNativeCompetitionRecord,
  useIsExternalBrowser,
} from "@/shared/lib/native-bridge";
import { useToast } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";
import { CloseIcon } from "@/shared/ui/icons";

const DISMISSED_KEY_PREFIX = "oss.competition.result-prompt.dismissed.";
const DISMISS_EVENT = "oss:competition-result-prompt-dismissed";

/**
 * 끝난 대회의 결과 남기기 배너 (#368).
 *
 * 맨 위(앱바 아래)에 화면 흐름 안에 놓아 읽던 내용을 가리지 않는다. ✕로 닫으면 이 기기에서 같은 대회에 다시 뜨지 않는다.
 * "내 기록에 남기기"는 앱의 대회 정보 추가를 이 대회로 채워 연다(jiu-jitsu-ios#252) — 결과 입력은 앱 화면이다.
 * 그래서 앱 밖 브라우저에서는 배너를 두지 않는다(위에 '앱으로 보기' 배너가 있다).
 * 닫은 기록은 브라우저 저장소에만 있어 서버는 모른다 — 서버 그림에 배너를 넣어 두고, 닫아 둔 기기에서만 걷어 낸다.
 */
export function CompetitionResultBanner({
  competitionId,
  name,
  year,
  daysAgo,
}: {
  competitionId: string;
  name: string;
  year: number;
  daysAgo: number;
}) {
  const externalBrowser = useIsExternalBrowser();
  const dismissed = useSyncExternalStore(
    subscribeDismissed,
    () => readDismissed(competitionId),
    // 서버 그림에는 배너를 넣어 둔다 — 늦게 나타나면 아래 내용이 배너 높이만큼 밀려 내려간다.
    // 닫아 둔 사람만 그린 뒤 걷힌다(닫은 기록은 이 기기에만 있다).
    () => false,
  );
  const { guard } = useLoginGuard();
  const toast = useToast();

  if (externalBrowser || dismissed) return null;

  function leaveRecord() {
    if (openNativeCompetitionRecord({ competitionId, name, year })) return;
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
          {daysAgo <= 1 ? "어제 끝난 대회예요" : `${daysAgo}일 전에 끝난 대회예요`}
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
        onClick={() => writeDismissed(competitionId)}
        className="-mt-1.5 flex-none text-icon-secondary"
      >
        <CloseIcon size={20} />
      </IconButton>
    </aside>
  );
}

/** 저장소를 못 쓰는 환경(사생활 보호 모드)에서도 지금 화면에서는 닫히게 기억해 둔다. */
const hiddenThisSession = new Set<string>();

function readDismissed(competitionId: string): boolean {
  if (hiddenThisSession.has(competitionId)) return true;
  try {
    return (
      window.localStorage.getItem(DISMISSED_KEY_PREFIX + competitionId) === "1"
    );
  } catch {
    return false;
  }
}

function writeDismissed(competitionId: string) {
  hiddenThisSession.add(competitionId);
  try {
    window.localStorage.setItem(DISMISSED_KEY_PREFIX + competitionId, "1");
  } catch {
    // 저장하지 못하면 다시 열었을 때 또 뜬다.
  }
  window.dispatchEvent(new Event(DISMISS_EVENT));
}

function subscribeDismissed(onChange: () => void) {
  window.addEventListener(DISMISS_EVENT, onChange);
  return () => window.removeEventListener(DISMISS_EVENT, onChange);
}
