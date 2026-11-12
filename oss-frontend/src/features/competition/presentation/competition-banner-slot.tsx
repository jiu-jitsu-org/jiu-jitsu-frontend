"use client";

import { useSyncExternalStore } from "react";

import {
  nextBannerSlotKey,
  type BannerSlotItem,
} from "@/features/competition/domain/competition-banner-slot";
import type { DeadlineSoonItem } from "@/features/competition/domain/competition-interest-banner";
import { daysBetween } from "@/features/competition/domain/competition-registration";
import type { ResultCardGroup } from "@/features/competition/domain/competition-result-prompt";
import {
  DeadlineSoonBanner,
  dismissDeadlineBanner,
  isDeadlineBannerDismissed,
  subscribeDeadlineBannerDismissed,
} from "@/features/competition/presentation/competition-interest-banner";
import { CompetitionResultCard } from "@/features/competition/presentation/competition-result-card";
import {
  dismissResultPrompt,
  isResultPromptDismissed,
  subscribeResultPromptDismissed,
} from "@/features/competition/presentation/competition-result-dismissed";
import { isNativeBridgeAvailable } from "@/shared/lib/native-bridge";

/** 배너 자리에 지금 띄운 배너 하나 — 종류에 맞는 배너를 그린다. 새 종류는 여기에 갈래를 더한다. */
export function CompetitionBannerSlot({
  item,
  today,
  onSelectDeadline,
  onClose,
}: {
  item: BannerSlotItem;
  today: string;
  onSelectDeadline: (item: DeadlineSoonItem) => void;
  onClose: () => void;
}) {
  switch (item.kind) {
    case "result":
      return <CompetitionResultCard group={item.group} onClose={onClose} />;
    case "deadline":
      return (
        <DeadlineSoonBanner
          item={item.deadline}
          today={today}
          onSelect={onSelectDeadline}
          onClose={onClose}
        />
      );
  }
}

/** ✕로 닫은 배너를 이 기기에 기억한다 — 종류마다 원래 쓰던 닫은 기록을 그대로 쓴다. */
export function dismissBannerSlotItem(item: BannerSlotItem) {
  switch (item.kind) {
    case "result":
      dismissResultPrompt(item.group.competitions.map(({ id }) => id));
      return;
    case "deadline":
      dismissDeadlineBanner(item.deadline);
      return;
  }
}

/**
 * 배너 자리에 띄울 한 장 — 대기열에서 이번에 띄울 배너를 정하고, ✕로 닫았으면 null.
 *
 * 정하는 때는 화면(문서)을 처음 그릴 때 한 번이다.
 * - 처음 들어오면 닫지 않은 결과 남기기 중 한 장을 무작위로, 없으면 대기열 맨 앞부터 닫지 않은 첫 배너.
 * - 앱에서 당겨서 새로고침하면 앱이 웹뷰를 다시 불러온다(webView.reload). 그때는 지난번 배너(sessionStorage) 다음 장으로
 *   넘긴다 — 끝에 닿으면 처음으로, 닫은 배너는 건너뛴다. 브라우저 새로고침도 같다.
 * - 같은 문서 안에서 다시 그려지면(상세에서 돌아와 router.refresh 등) 정한 배너를 그대로 둔다.
 * ✕로 닫으면 그 자리는 빈 채로 두고 다음 새로고침에서 다음 장을 띄운다.
 *
 * 닫은 기록이 이 기기의 브라우저 저장소에만 있어, 서버 그림과 첫 그림에서는 아직 정하지 않는다(ready: false).
 * 결과 남기기는 앱 웹뷰에서만 띄운다 — '내 기록에 남기기'가 앱 화면을 여는 일이라서다(상세 배너와 같다).
 */
export function useBannerSlot(queue: readonly BannerSlotItem[]): {
  ready: boolean;
  item: BannerSlotItem | null;
} {
  const snapshot = useSyncExternalStore(
    subscribeDismissed,
    () => slotSnapshot(queue),
    () => PENDING,
  );
  if (snapshot === PENDING) return { ready: false, item: null };
  const [key, openIds] = snapshot.split("\n");
  const item = queue.find((candidate) => candidate.key === key);
  if (!item) return { ready: true, item: null };
  if (item.kind !== "result") return { ready: true, item };
  return {
    ready: true,
    item: { ...item, group: openGroup(item.group, openIds.split(",").map(Number)) },
  };
}

const PENDING = "\u0000pending";
const ROTATION_KEY = "oss.competition.banner-slot.current";

/** 이 문서에서 정한 배너 이름 — 문서를 다시 불러오기 전까지 그대로다. */
let decided: { key: string | null } | null = null;

/**
 * 지금 보일 배너 — "이름" 또는 결과 남기기면 "이름\n아직 닫지 않은 대회 id들". 보일 배너가 없으면 "".
 * 문자열이라 값이 같으면 다시 그리지 않는다.
 */
function slotSnapshot(queue: readonly BannerSlotItem[]): string {
  const inApp = isNativeBridgeAvailable();
  const usable = queue.filter((item) => item.kind !== "result" || inApp);
  const key = decideKey(usable);
  const item = usable.find((candidate) => candidate.key === key);
  if (!item || !isOpen(item)) return "";
  if (item.kind !== "result") return item.key;
  return `${item.key}\n${openResultIds(item.group).join(",")}`;
}

function decideKey(queue: readonly BannerSlotItem[]): string | null {
  // 정한 배너가 대기열에서 빠졌거나(관심을 끔·다른 계정), 띄울 게 없었는데 새 배너가 생기면 다시 정한다.
  if (decided) {
    const kept =
      decided.key === null
        ? !queue.some(isOpen)
        : queue.some((item) => item.key === decided?.key);
    if (kept) return decided.key;
    decided = null;
  }
  // 관심 목록이 아직 비어 있으면(로그인 판정 전 등) 정하지 않고 다음 그림에서 다시 본다.
  if (queue.length === 0) return null;
  const byKey = new Map(queue.map((item) => [item.key, item]));
  const key =
    (!isReloadedDocument() && randomOpenResult(queue)) ||
    nextBannerSlotKey(
      queue.map((item) => item.key),
      (candidate) => {
        const item = byKey.get(candidate);
        return item ? isOpen(item) : false;
      },
      isReloadedDocument() ? readRotation() : null,
    );
  decided = { key };
  writeRotation(key);
  return key;
}

/** 처음 들어올 때 띄울 결과 남기기 — 끝난 관심 대회가 여럿이면 매번 같은 대회만 묻지 않게 무작위로 한 장. */
function randomOpenResult(queue: readonly BannerSlotItem[]): string | null {
  const open = queue.filter((item) => item.kind === "result" && isOpen(item));
  if (open.length === 0) return null;
  return open[Math.floor(Math.random() * open.length)].key;
}

function isOpen(item: BannerSlotItem): boolean {
  switch (item.kind) {
    case "result":
      return openResultIds(item.group).length > 0;
    case "deadline":
      return !isDeadlineBannerDismissed(item.deadline);
  }
}

function openResultIds(group: ResultCardGroup): number[] {
  return group.competitions
    .filter(({ id }) => !isResultPromptDismissed(id))
    .map(({ id }) => id);
}

/**
 * 묶음에서 닫은 대회를 뺀 것(상세에서 하나만 닫았을 수 있다).
 * 묶음의 '며칠 전'은 가장 늦게 끝난 대회 기준이다. 그 대회를 닫아 빠졌으면 남은 마지막 대회로 다시 센다
 * — 토·일 묶음에서 일요일 대회만 닫으면 토요일 대회가 '어제 끝난'으로 보이지 않게.
 */
function openGroup(group: ResultCardGroup, openIds: number[]): ResultCardGroup {
  const open = new Set(openIds);
  const competitions = group.competitions.filter(({ id }) => open.has(id));
  const latest = competitions.at(-1);
  const original = group.competitions.at(-1);
  if (!latest || !original) return group;
  return {
    ...group,
    competitions,
    daysAgo: group.daysAgo + daysBetween(latest.date, original.date),
  };
}

/** 이 문서가 새로고침으로 열렸는지 — 앱의 당겨서 새로고침은 웹뷰를 다시 불러온다. */
export function isReloadedDocument(): boolean {
  try {
    const [entry] = performance.getEntriesByType("navigation");
    return (
      (entry as PerformanceNavigationTiming | undefined)?.type === "reload"
    );
  } catch {
    return false;
  }
}

function readRotation(): string | null {
  try {
    return window.sessionStorage.getItem(ROTATION_KEY);
  } catch {
    return null;
  }
}

function writeRotation(key: string | null) {
  try {
    if (key) window.sessionStorage.setItem(ROTATION_KEY, key);
    else window.sessionStorage.removeItem(ROTATION_KEY);
  } catch {
    // 저장하지 못하면 다음 새로고침도 맨 앞부터 띄운다.
  }
}

function subscribeDismissed(onChange: () => void) {
  const offDeadline = subscribeDeadlineBannerDismissed(onChange);
  const offResult = subscribeResultPromptDismissed(onChange);
  return () => {
    offDeadline();
    offResult();
  };
}
