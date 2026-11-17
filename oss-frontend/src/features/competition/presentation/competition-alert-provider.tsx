"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
import {
  deadlineAlertsPassedToday,
  type CompetitionAlertSettings,
  type CompetitionNoticeResult,
  type DeadlineAlertClock,
} from "@/features/competition/domain/competition-alert";
import {
  answerCompetitionAlertPromptAction,
  setCompetitionNoticeAction,
} from "@/features/competition/presentation/actions/competition-alert-actions";
import { retryAfterSessionRefresh } from "@/features/competition/presentation/retry-after-session-refresh";
import { deadlineAlertClockAt } from "@/features/competition/presentation/competition-alert-clock";
import {
  CompetitionAlertSheet,
  DEADLINE_ALERT_PASSED_MESSAGE,
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
  /**
   * 처음 관심 등록했을 때만 시트를 연다(#375) — 설정이 꺼져 있고 아직 물어본 적이 없을 때(서버 값).
   * 오늘 알림이 이미 나가 이 대회에 남은 알림이 없으면 묻지 않고 그렇다고만 알린다(#548) — 다음 대회에서 다시 묻는다.
   */
  askOnFirstInterest: (target: CompetitionAlertTarget) => void;
  /** 지금(서버 시각) 오늘 알림이 이미 나가 이 대회에 남은 알림이 없는지(#548) — 켜도 받을 알림이 없다. */
  alertsPassedToday: (target: CompetitionAlertTarget) => boolean;
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
 * 남은 알림은 시트를 여는 순간의 서버 시각으로 가른다(#548) — 대회 탭처럼 오래 떠 있는 화면에서도 저녁 6시가
 * 지나면 오늘 알림을 약속하지 않는다. 서버가 그린 시각에 그 뒤 지난 시간만 더한다 — 기기 시각을 바꿔도 서버 기준이다.
 */
export function CompetitionAlertProvider({
  settings,
  serverNow,
  children,
}: {
  settings: CompetitionAlertSettings | null;
  /** 서버가 그린 시각(ms) — 시트를 여는 순간의 서버 시각을 여기서부터 센다. */
  serverNow: number;
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
    /** 연 순간의 시각 — 닫히는 동안에도 줄이 바뀌지 않게 같이 둔다. */
    clock: DeadlineAlertClock;
  }>(() => ({
    target: null,
    open: false,
    clock: deadlineAlertClockAt(serverNow),
  }));
  const pending = useRef(new Set<number>());
  // '알림 받기'를 빠르게 두 번 눌러도 한 번만 켠다 — 시트가 내려가는 동안 버튼이 남아 있다.
  const answering = useRef(false);
  // 서버가 그린 시각을 받은 순간의 기기 시계 · 단조 시계. 마운트 전(서버 렌더)에는 없어 serverNow를 그대로 쓴다.
  const clockBase = useRef<{ wall: number; mono: number } | null>(null);
  useEffect(() => {
    clockBase.current = { wall: Date.now(), mono: performance.now() };
  }, [serverNow]);
  // 지난 시간은 기기 시계와 단조 시계 중 큰 쪽으로 센다 — 화면을 연 채 기기 시각을 뒤로 돌려도
  // 줄어들지 않고(단조 시계), 기기가 잠든 동안 멈추는 단조 시계 대신 기기 시계가 잠든 시간을 센다.
  // 앞으로 돌리면 늦게 센 만큼 오늘 알림을 약속하지 않는 쪽이라 안전하다.
  const clockNow = useCallback(() => {
    const base = clockBase.current;
    if (!base) return deadlineAlertClockAt(serverNow);
    const elapsed = Math.max(
      Date.now() - base.wall,
      performance.now() - base.mono,
      0,
    );
    return deadlineAlertClockAt(serverNow + elapsed);
  }, [serverNow]);

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

  const alertsPassedToday = useCallback(
    (target: CompetitionAlertTarget) =>
      deadlineAlertsPassedToday(target.registration, clockNow()),
    [clockNow],
  );

  const ask = useCallback(
    (target: CompetitionAlertTarget) => {
      if (!available) return;
      setSheet({ target, open: true, clock: clockNow() });
    },
    [available, clockNow],
  );

  const askOnFirstInterest = useCallback(
    (target: CompetitionAlertTarget) => {
      // 앱 설정에서 이미 켰거나 한 번 물어본 사람에게는 묻지 않는다.
      if (!available || enabled || asked) return;
      const clock = clockNow();
      // 받을 알림이 남지 않았으면 묻지 않는다 — 물어본 것으로도 남기지 않아 다음 대회에서 묻는다.
      if (deadlineAlertsPassedToday(target.registration, clock)) {
        toast.show(DEADLINE_ALERT_PASSED_MESSAGE, { tone: "info" });
        return;
      }
      // 답을 기다리는 동안 다른 대회를 눌러도 다시 묻지 않게 먼저 표시한다.
      setAskedOverride(true);
      setSheet({ target, open: true, clock });
    },
    [asked, available, clockNow, enabled, toast],
  );

  const setNotice = useCallback(
    async (id: number, on: boolean) => {
      if (!available || pending.current.has(id)) return null;
      pending.current.add(id);
      try {
        const result = await retryAfterSessionRefresh(() =>
          setCompetitionNoticeAction(id, on),
        );
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
      const result = await retryAfterSessionRefresh(() =>
        answerCompetitionAlertPromptAction(true),
      );
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
    void retryAfterSessionRefresh(() =>
      answerCompetitionAlertPromptAction(false),
    ).catch(() => undefined);
  };

  const value = useMemo<CompetitionAlerts>(
    () => ({
      available,
      enabled,
      ask,
      askOnFirstInterest,
      alertsPassedToday,
      setNotice,
    }),
    [alertsPassedToday, ask, askOnFirstInterest, available, enabled, setNotice],
  );

  return (
    <CompetitionAlertsContext.Provider value={value}>
      {children}
      <CompetitionAlertSheet
        target={sheet.target}
        open={sheet.open}
        clock={sheet.clock}
        onAccept={() => void accept()}
        onLater={later}
      />
    </CompetitionAlertsContext.Provider>
  );
}
