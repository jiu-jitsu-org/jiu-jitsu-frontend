"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useIsSignedIn } from "@/features/auth/presentation/auth-provider";
import type { CompetitionAlertSettings } from "@/features/competition/domain/competition-alert";
import {
  setCompetitionAlertMutedAction,
  setCompetitionAlertsEnabledAction,
} from "@/features/competition/presentation/actions/competition-alert-actions";
import {
  CompetitionAlertSheet,
  type CompetitionAlertTarget,
} from "@/features/competition/presentation/competition-alert-sheet";
import { notifyCompetitionAlertsEnabled } from "@/shared/lib/native-bridge";
import { useToast } from "@/shared/ui";

/** 이 기기에서 첫 관심 등록 시트를 띄운 적이 있는지 — 다음 관심 등록부터는 묻지 않는다(#375). */
const ASKED_KEY = "oss.competition.alert.asked";

export type CompetitionAlerts = {
  /** 로그인했고 설정을 읽었는지 — 아니면 알림을 켜고 끌 수 없다. */
  available: boolean;
  /** 설정의 '관심 대회 알림'이 켜져 있는지 */
  enabled: boolean;
  /** 이 대회 알림만 꺼 두었는지(#376) */
  isMuted: (competitionId: string) => boolean;
  /** 마감 알림 시트를 연다 — 대회 상세에서 알림을 켜는데 설정이 꺼져 있을 때(#376). */
  ask: (target: CompetitionAlertTarget) => void;
  /** 이 기기에서 처음 관심 등록했을 때만 시트를 연다(#375). 설정이 이미 켜져 있으면 묻지 않는다. */
  askOnFirstInterest: (target: CompetitionAlertTarget) => void;
  /** 이 대회 알림 끄기·다시 받기. 먼저 바꿔 보여 주고 실패하면 되돌린다. 성공 여부를 돌려준다. */
  setMuted: (competitionId: string, muted: boolean) => Promise<boolean>;
};

const CompetitionAlertsContext = createContext<CompetitionAlerts | null>(null);

/** 알림 설정이 필요한 화면(대회 탭·대회 상세·피드·글 상세·알림함)이 감싼다. 없으면 시트 없이 관심만 등록된다. */
export function useCompetitionAlerts(): CompetitionAlerts | null {
  return useContext(CompetitionAlertsContext);
}

/**
 * 관심 대회 마감 알림 설정과 첫 관심 등록 시트 (#375 · #376).
 *
 * 서버가 그린 설정(props) 위에 이 화면에서 바꾼 값을 덮어 쓴다 — 관심 등록 훅과 같은 방식이다.
 * 비로그인이면 설정이 없다(null) — 알림을 켤 수도 없고 시트도 뜨지 않는다.
 */
export function CompetitionAlertProvider({
  settings,
  today,
  children,
}: {
  settings: CompetitionAlertSettings | null;
  /** 한국 날짜 "YYYY-MM-DD" — 시트가 지난 마감을 뺀다. */
  today: string;
  children: ReactNode;
}) {
  const signedIn = useIsSignedIn();
  const toast = useToast();
  const [enabledOverride, setEnabledOverride] = useState<boolean | null>(null);
  const [mutedOverrides, setMutedOverrides] = useState<Record<string, boolean>>(
    {},
  );
  const [sheet, setSheet] = useState<{
    target: CompetitionAlertTarget | null;
    open: boolean;
  }>({ target: null, open: false });
  const pending = useRef(new Set<string>());
  // '알림 받기'를 빠르게 두 번 눌러도 한 번만 켠다 — 시트가 내려가는 동안 버튼이 남아 있다.
  const accepting = useRef(false);

  // 서버 값이 새로 오거나 로그인 상태가 바뀌면 덮어 쓴 값을 비운다(관심 등록 훅과 같은 이유).
  const [seen, setSeen] = useState({ settings, signedIn });
  if (seen.settings !== settings || seen.signedIn !== signedIn) {
    setSeen({ settings, signedIn });
    setEnabledOverride(null);
    setMutedOverrides({});
  }

  const available = signedIn && settings !== null;
  const enabled =
    signedIn && settings !== null && (enabledOverride ?? settings.enabled);
  const serverMuted = useMemo(
    () => new Set(settings?.mutedIds ?? []),
    [settings],
  );

  const isMuted = useCallback(
    (id: string) => mutedOverrides[id] ?? serverMuted.has(id),
    [mutedOverrides, serverMuted],
  );

  const ask = useCallback(
    (target: CompetitionAlertTarget) => {
      if (!available) return;
      markAsked();
      setSheet({ target, open: true });
    },
    [available],
  );

  const askOnFirstInterest = useCallback(
    (target: CompetitionAlertTarget) => {
      if (!available || !takeFirstAsk()) return;
      // 앱 설정에서 이미 켠 사람에게는 묻지 않는다 — 고를 것이 없다.
      if (enabled) return;
      setSheet({ target, open: true });
    },
    [available, enabled],
  );

  const setMuted = useCallback(
    async (id: string, muted: boolean) => {
      if (!available || pending.current.has(id)) return false;
      pending.current.add(id);
      const before = isMuted(id);
      setMutedOverrides((current) => ({ ...current, [id]: muted }));
      try {
        const result = await setCompetitionAlertMutedAction(id, muted);
        if (!result.ok) throw new Error(result.reason);
        return true;
      } catch {
        setMutedOverrides((current) => ({ ...current, [id]: before }));
        toast.show("알림을 설정하지 못했어요", { tone: "error" });
        return false;
      } finally {
        pending.current.delete(id);
      }
    },
    [available, isMuted, toast],
  );

  const closeSheet = () => setSheet((current) => ({ ...current, open: false }));

  const accept = async () => {
    if (accepting.current) return;
    accepting.current = true;
    const target = sheet.target;
    closeSheet();
    const before = enabledOverride;
    setEnabledOverride(true);
    try {
      const result = await setCompetitionAlertsEnabledAction(true);
      if (!result.ok) throw new Error(result.reason);
      // 시트가 묻던 대회를 꺼 두었으면 함께 켠다 — 상세에서 알림을 켜려다 시트가 뜬 경우다(#376).
      // 실패하면 setMuted가 이미 실패를 알렸다 — 켜졌다고 다시 말하지 않는다.
      if (target && isMuted(target.id) && !(await setMuted(target.id, false))) {
        return;
      }
      toast.show("관심 대회 마감 전날 알려 드릴게요", { tone: "success" });
      // 기기 알림이 꺼져 있으면 앱이 켜는 방법을 안내한다(jiu-jitsu-ios#257).
      if (target) notifyCompetitionAlertsEnabled({ competitionId: target.id });
    } catch {
      setEnabledOverride(before);
      toast.show("알림을 켜지 못했어요. 다시 시도해 주세요", { tone: "error" });
    } finally {
      accepting.current = false;
    }
  };

  const value = useMemo<CompetitionAlerts>(
    () => ({ available, enabled, isMuted, ask, askOnFirstInterest, setMuted }),
    [ask, askOnFirstInterest, available, enabled, isMuted, setMuted],
  );

  return (
    <CompetitionAlertsContext.Provider value={value}>
      {children}
      <CompetitionAlertSheet
        target={sheet.target}
        open={sheet.open}
        today={today}
        onAccept={() => void accept()}
        onLater={closeSheet}
      />
    </CompetitionAlertsContext.Provider>
  );
}

/**
 * 처음이면 표시를 남기고 true. 저장소를 못 쓰는 환경(사생활 보호 모드)이면 매번 false —
 * 관심 등록마다 시트가 뜨는 것보다 안 뜨는 편이 낫다(알림은 앱 설정에서도 켤 수 있다).
 */
function takeFirstAsk(): boolean {
  try {
    if (window.localStorage.getItem(ASKED_KEY)) return false;
    window.localStorage.setItem(ASKED_KEY, "1");
    return true;
  } catch {
    return false;
  }
}

function markAsked() {
  try {
    window.localStorage.setItem(ASKED_KEY, "1");
  } catch {
    // 표시를 못 남겨도 상세에서 묻는 시트는 사용자가 눌러서 연 것이라 괜찮다.
  }
}
