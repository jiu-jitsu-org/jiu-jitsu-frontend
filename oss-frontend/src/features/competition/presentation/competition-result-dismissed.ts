"use client";

import { useSyncExternalStore } from "react";

import {
  closeResultPromptOn,
  isLegacyResultPromptClose,
  isResultPromptClosedOn,
  parseResultPromptClose,
  serializeResultPromptClose,
} from "@/features/competition/domain/competition-result-prompt";

/**
 * 결과 남기기 안내를 닫은 기록 — 대회 상세 배너(#368)와 대회 탭 카드(#403)가 함께 쓴다.
 *
 * 어느 쪽에서 ✕로 닫아도 두 곳 모두 같은 규칙을 따른다(domain `closeResultPromptOn`): 처음 닫으면 그날만 숨고
 * 다음 날 카드 기간 안이면 한 번 더 뜬다. 다시 떴을 때 또 닫으면 그 대회는 더 뜨지 않는다.
 * "오늘"은 호출부가 서버 시각으로 정한 한국 날짜다 — 기기 시계를 믿지 않는다.
 * 기록은 이 기기의 브라우저 저장소에만 있어 서버는 모른다 — 서버 그림에는 안내를 넣어 두고, 숨길 기기에서만 그린 뒤
 * 걷어 낸다(늦게 나타나면 아래 내용이 안내 높이만큼 밀려 내려간다).
 * 저장 이름은 #368 때 것을 그대로 쓴다. 전에 쓰던 값 "1"은 처음 읽는 날 닫은 것으로 보고 날짜를 붙여 다시 써 둔다.
 *
 * 앱에서 기록을 남긴 대회(#545)도 지금 화면에서 바로 닫는다 — 이건 저장소에 남기지 않는다. 다음에 화면을 열면 서버가
 * 내 대회 기록을 보고 거르므로, 나중에 기록을 지우면 다시 물을 수 있다.
 */
const DISMISSED_KEY_PREFIX = "oss.competition.result-prompt.dismissed.";
const DISMISS_EVENT = "oss:competition-result-prompt-dismissed";

/** 저장소를 못 쓰는 환경(사생활 보호 모드)에서도 지금 화면에서는 닫히게 기억해 둔다. */
const hiddenThisSession = new Set<number>();

/** 이 화면을 연 뒤 앱에서 기록을 남긴 대회(#545). */
const recordedThisSession = new Set<number>();

/** 오늘 이 대회의 결과 남기기 안내를 숨기는지. 서버 그림에서는 늘 false. */
export function useResultPromptDismissed(
  competitionId: number,
  today: string,
): boolean {
  return useSyncExternalStore(
    subscribeResultPromptDismissed,
    () => isResultPromptDismissed(competitionId, today),
    () => false,
  );
}

export function isResultPromptDismissed(
  competitionId: number,
  today: string,
): boolean {
  if (hiddenThisSession.has(competitionId)) return true;
  if (recordedThisSession.has(competitionId)) return true;
  return isResultPromptClosedOn(readRecord(competitionId, today), today);
}

/** ✕ — 대회마다 닫은 기록을 하나씩 올린다(같은 주말 묶음이면 묶음 안 대회 모두). */
export function dismissResultPrompt(
  competitionIds: readonly number[],
  today: string,
) {
  for (const competitionId of competitionIds) {
    hiddenThisSession.add(competitionId);
    const next = closeResultPromptOn(readRecord(competitionId, today), today);
    try {
      window.localStorage.setItem(
        DISMISSED_KEY_PREFIX + competitionId,
        serializeResultPromptClose(next),
      );
    } catch {
      // 저장하지 못하면 다시 열었을 때 또 뜬다.
    }
  }
  window.dispatchEvent(new Event(DISMISS_EVENT));
}

/** 기록을 남긴 대회의 결과 남기기 안내를 지금 화면에서 닫는다(#545) — 상세 배너 · 대회 탭 카드가 함께 닫힌다. */
export function markResultRecorded(competitionIds: readonly number[]) {
  const added = competitionIds.filter((id) => !recordedThisSession.has(id));
  if (added.length === 0) return;
  for (const competitionId of added) recordedThisSession.add(competitionId);
  window.dispatchEvent(new Event(DISMISS_EVENT));
}

/** 어디서든 결과 남기기 안내를 닫으면 알린다 — 대회 탭 배너 자리가 같이 듣는다. */
export function subscribeResultPromptDismissed(onChange: () => void) {
  window.addEventListener(DISMISS_EVENT, onChange);
  return () => window.removeEventListener(DISMISS_EVENT, onChange);
}

/** 저장된 닫은 기록. 전에 쓰던 값이면 오늘 닫은 것으로 다시 써 둔다 — 내일 읽어도 '어제 닫음'으로 이어진다. */
function readRecord(competitionId: number, today: string) {
  try {
    const key = DISMISSED_KEY_PREFIX + competitionId;
    const raw = window.localStorage.getItem(key);
    const record = parseResultPromptClose(raw, today);
    if (record && isLegacyResultPromptClose(raw)) {
      window.localStorage.setItem(key, serializeResultPromptClose(record));
    }
    return record;
  } catch {
    return null;
  }
}
