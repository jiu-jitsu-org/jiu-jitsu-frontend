"use client";

import { useSyncExternalStore } from "react";

/**
 * 결과 남기기 안내를 닫은 기록 — 대회 상세 배너(#368)와 대회 탭 카드(#403)가 함께 쓴다.
 *
 * 어느 쪽에서 ✕로 닫아도 그 대회는 두 곳 모두에서 다시 뜨지 않는다. 기록은 이 기기의 브라우저 저장소에만 있어
 * 서버는 모른다 — 서버 그림에는 안내를 넣어 두고, 닫아 둔 기기에서만 그린 뒤 걷어 낸다
 * (늦게 나타나면 아래 내용이 안내 높이만큼 밀려 내려간다).
 * 저장 이름은 #368 때 것을 그대로 써서 전에 상세에서 닫은 기록도 이어진다.
 */
const DISMISSED_KEY_PREFIX = "oss.competition.result-prompt.dismissed.";
const DISMISS_EVENT = "oss:competition-result-prompt-dismissed";

/** 저장소를 못 쓰는 환경(사생활 보호 모드)에서도 지금 화면에서는 닫히게 기억해 둔다. */
const hiddenThisSession = new Set<string>();

/** 이 대회의 결과 남기기 안내를 닫았는지. 서버 그림에서는 늘 false. */
export function useResultPromptDismissed(competitionId: string): boolean {
  return useSyncExternalStore(
    subscribeResultPromptDismissed,
    () => isResultPromptDismissed(competitionId),
    () => false,
  );
}

/**
 * 여러 대회 중 아직 닫지 않은 대회 id — 쉼표로 이은 문자열이라 값이 같으면 다시 그리지 않는다.
 * 서버 그림에서는 모두 닫지 않은 것으로 본다.
 */
export function useOpenResultPromptIds(competitionIds: readonly string[]) {
  return useSyncExternalStore(
    subscribeResultPromptDismissed,
    () => competitionIds.filter((id) => !isResultPromptDismissed(id)).join(","),
    () => competitionIds.join(","),
  );
}

export function isResultPromptDismissed(competitionId: string): boolean {
  if (hiddenThisSession.has(competitionId)) return true;
  try {
    return (
      window.localStorage.getItem(DISMISSED_KEY_PREFIX + competitionId) === "1"
    );
  } catch {
    return false;
  }
}

export function dismissResultPrompt(competitionIds: readonly string[]) {
  for (const competitionId of competitionIds) {
    hiddenThisSession.add(competitionId);
    try {
      window.localStorage.setItem(DISMISSED_KEY_PREFIX + competitionId, "1");
    } catch {
      // 저장하지 못하면 다시 열었을 때 또 뜬다.
    }
  }
  window.dispatchEvent(new Event(DISMISS_EVENT));
}

/** 어디서든 결과 남기기 안내를 닫으면 알린다 — 대회 탭 배너 자리가 같이 듣는다. */
export function subscribeResultPromptDismissed(onChange: () => void) {
  window.addEventListener(DISMISS_EVENT, onChange);
  return () => window.removeEventListener(DISMISS_EVENT, onChange);
}
