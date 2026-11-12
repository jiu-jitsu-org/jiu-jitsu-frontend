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

import {
  useAuth,
  useIsSignedIn,
} from "@/features/auth/presentation/auth-provider";
import { COMPETITION_GONE_MESSAGE } from "@/features/community/presentation/notifications/inbox-copy";
import type {
  CompetitionAlertSettings,
  CompetitionNoticeResult,
} from "@/features/competition/domain/competition-alert";
import {
  answerCompetitionAlertPromptAction,
  setCompetitionNoticeAction,
} from "@/features/competition/presentation/actions/competition-alert-actions";
import {
  CompetitionAlertSheet,
  type CompetitionAlertTarget,
} from "@/features/competition/presentation/competition-alert-sheet";
import { notifyCompetitionAlertsEnabled } from "@/shared/lib/native-bridge";
import { useToast } from "@/shared/ui";

export type CompetitionAlerts = {
  /** 로그인했고 설정을 읽었는지 — 아니면 알림을 켜고 끌 수 없다. */
  available: boolean;
  /** 설정의 '관심 대회 알림'이 켜져 있는지(competitionEnabled) */
  enabled: boolean;
  /** 마감 알림 시트를 연다 — 대회 상세에서 알림을 켜는데 설정이 꺼져 있을 때(#376). */
  ask: (target: CompetitionAlertTarget) => void;
  /** 처음 관심 등록했을 때만 시트를 연다(#375) — 설정이 꺼져 있고 아직 물어본 적이 없을 때(서버 값). */
  askOnFirstInterest: (target: CompetitionAlertTarget) => void;
  /**
   * 이 대회 알림 켜기·끄기(#376 · #377). 켜면 관심도 함께 등록된다. 실패하면 토스트로 알리고 null.
   */
  setNotice: (
    competitionId: number,
    enabled: boolean,
  ) => Promise<CompetitionNoticeResult | null>;
};

const CompetitionAlertsContext = createContext<CompetitionAlerts | null>(null);

/** 알림 설정이 필요한 화면(대회 탭·대회 상세·피드·글 상세·알림함)이 감싼다. 없으면 시트 없이 관심만 등록된다. */
export function useCompetitionAlerts(): CompetitionAlerts | null {
  return useContext(CompetitionAlertsContext);
}

/**
 * 관심 대회 마감 알림 설정과 첫 관심 등록 시트 (#375 · #376 · #422).
 *
 * 서버가 그린 설정(props) 위에 이 화면에서 바꾼 값을 덮어 쓴다 — 관심 등록 훅과 같은 방식이다.
 * 비로그인이면 설정이 없다(null) — 알림을 켤 수도 없고 시트도 뜨지 않는다.
 * 시트의 답은 '알림 받기'·'나중에' 모두 서버에 남긴다(PUT /notice/setting/competition) — 다음부터 묻지 않는다.
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
  const { promptLogin } = useAuth();
  const toast = useToast();
  const [enabledOverride, setEnabledOverride] = useState<boolean | null>(null);
  const [askedOverride, setAskedOverride] = useState(false);
  const [sheet, setSheet] = useState<{
    target: CompetitionAlertTarget | null;
    open: boolean;
  }>({ target: null, open: false });
  const pending = useRef(new Set<number>());
  // '알림 받기'를 빠르게 두 번 눌러도 한 번만 켠다 — 시트가 내려가는 동안 버튼이 남아 있다.
  const answering = useRef(false);

  // 서버 값이 새로 오거나 로그인 상태가 바뀌면 덮어 쓴 값을 비운다(관심 등록 훅과 같은 이유).
  const [seen, setSeen] = useState({ settings, signedIn });
  if (seen.settings !== settings || seen.signedIn !== signedIn) {
    setSeen({ settings, signedIn });
    setEnabledOverride(null);
    setAskedOverride(false);
  }

  const available = signedIn && settings !== null;
  const enabled =
    signedIn && settings !== null && (enabledOverride ?? settings.enabled);
  const asked = askedOverride || (settings?.asked ?? false);

  const ask = useCallback(
    (target: CompetitionAlertTarget) => {
      if (!available) return;
      setSheet({ target, open: true });
    },
    [available],
  );

  const askOnFirstInterest = useCallback(
    (target: CompetitionAlertTarget) => {
      // 앱 설정에서 이미 켰거나 한 번 물어본 사람에게는 묻지 않는다.
      if (!available || enabled || asked) return;
      // 답을 기다리는 동안 다른 대회를 눌러도 다시 묻지 않게 먼저 표시한다.
      setAskedOverride(true);
      setSheet({ target, open: true });
    },
    [asked, available, enabled],
  );

  const setNotice = useCallback(
    async (id: number, on: boolean) => {
      if (!available || pending.current.has(id)) return null;
      pending.current.add(id);
      try {
        const result = await setCompetitionNoticeAction(id, on);
        if (!result.ok && result.reason === "not-found") {
          toast.show(COMPETITION_GONE_MESSAGE, { tone: "info" });
          return null;
        }
        if (!result.ok && result.reason === "unauthenticated") {
          // 화면은 로그인으로 알았는데 서버 세션이 끝났다 — 다시 눌러도 안 되니 로그인부터 안내한다.
          promptLogin({ reason: "대회 알림" });
          return null;
        }
        if (!result.ok) throw new Error(result.reason);
        return {
          interested: result.interested,
          interestCount: result.interestCount,
          noticeEnabled: result.noticeEnabled,
        };
      } catch {
        toast.show("알림을 설정하지 못했어요", { tone: "error" });
        return null;
      } finally {
        pending.current.delete(id);
      }
    },
    [available, promptLogin, toast],
  );

  const closeSheet = () => setSheet((current) => ({ ...current, open: false }));

  const accept = async () => {
    if (answering.current) return;
    answering.current = true;
    const target = sheet.target;
    closeSheet();
    const before = enabledOverride;
    setEnabledOverride(true);
    setAskedOverride(true);
    try {
      const result = await answerCompetitionAlertPromptAction(true);
      if (!result.ok && result.reason === "unauthenticated") {
        setEnabledOverride(before);
        promptLogin({ reason: "대회 알림" });
        return;
      }
      if (!result.ok) throw new Error(result.reason);
      toast.show("관심 대회 마감 전날 알려 드릴게요", { tone: "success" });
      // 켰다고 앱에 알린다 — 앱은 열린 설정 화면을 다시 읽고, 기기 알림이 꺼져 있으면 켜는 방법을 안내한다
      // (jiu-jitsu-ios#257 · #281). 묻던 대회가 없어도 보낸다.
      // 대회 id는 숫자 문자열로 보낸다 — 이미 깔린 앱은 문자열만 받는다(messages.ts).
      notifyCompetitionAlertsEnabled(
        target ? { competitionId: String(target.id) } : {},
      );
    } catch {
      setEnabledOverride(before);
      toast.show("알림을 켜지 못했어요. 다시 시도해 주세요", { tone: "error" });
    } finally {
      answering.current = false;
    }
  };

  // '나중에'·바깥 탭 — 설정은 그대로 두고 물어본 것만 서버에 남긴다. 실패해도 알릴 일은 없다(다음에 다시 물을 뿐).
  const later = () => {
    closeSheet();
    if (answering.current) return;
    setAskedOverride(true);
    void answerCompetitionAlertPromptAction(false).catch(() => undefined);
  };

  const value = useMemo<CompetitionAlerts>(
    () => ({ available, enabled, ask, askOnFirstInterest, setNotice }),
    [ask, askOnFirstInterest, available, enabled, setNotice],
  );

  return (
    <CompetitionAlertsContext.Provider value={value}>
      {children}
      <CompetitionAlertSheet
        target={sheet.target}
        open={sheet.open}
        today={today}
        onAccept={() => void accept()}
        onLater={later}
      />
    </CompetitionAlertsContext.Provider>
  );
}
