"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import {
  useAuth,
  useIsSignedIn,
} from "@/features/auth/presentation/auth-provider";
import { useLoginGuard } from "@/features/community/presentation/use-login-guard";
import { setCompetitionInterestAction } from "@/features/competition/presentation/actions/set-competition-interest-action";
import { retryAfterSessionRefresh } from "@/features/competition/presentation/retry-after-session-refresh";
import { useCompetitionAlerts } from "@/features/competition/presentation/competition-alert-provider";
import type { CompetitionAlertTarget } from "@/features/competition/presentation/competition-alert-sheet";
import { COMPETITION_GONE_MESSAGE } from "@/features/community/presentation/notifications/inbox-copy";
import type { Competition } from "@/features/competition/domain/competition";
import { detailStatusOn } from "@/features/competition/domain/competition-schedule";
import {
  regStatusOf,
  trackCompetitionInterest,
  type CompetitionInterestFrom,
  type CompetitionRegStatus,
} from "@/features/competition/presentation/competition-analytics";
import { useToast } from "@/shared/ui";

/**
 * 관심 기록(GA, #620)에 싣는 자리 · 단계. 단계를 주지 않으면 대회 전체(목록 · 카드의 Competition)를 받았을 때
 * 훅에 넘긴 오늘 기준 상세 단계로 센다. 대회 상세는 화면이 가진 단계를 넘긴다.
 */
export type CompetitionInterestContext = {
  from: CompetitionInterestFrom;
  regStatus?: CompetitionRegStatus;
};

export type CompetitionInterest = {
  /** 지금 내가 관심 등록한 대회 id (누르는 즉시 반영된 값). */
  interestedIds: ReadonlySet<number>;
  isInterested: (competitionId: number) => boolean;
  countOf: (competitionId: number) => number;
  /**
   * 관심 등록·해제. 비로그인이면 로그인 안내(외부 브라우저면 앱 안내)만 띄운다.
   * 대회 이름·접수 일정을 함께 받는 것은 첫 등록 때 마감 알림 시트(#375)가 이 대회의 알림 날을 보여 주기 때문이다.
   */
  toggle: (
    target: CompetitionAlertTarget | Competition,
    context: CompetitionInterestContext,
  ) => void;
  /** 관심 등록만(이미 등록돼 있으면 그대로). 시트는 띄우지 않는다 — 대회 상세의 알림 켜기(#376)가 쓴다. 성공 여부를 돌려준다. */
  register: (target: CompetitionAlertTarget) => Promise<boolean>;
  /** 다른 요청이 돌려준 관심 상태로 맞춘다 — 이 대회 알림을 켜면 관심도 함께 등록된다(#376 · #422). */
  apply: (competitionId: number, interested: boolean, count: number) => void;
};

type Override = { interested: boolean; count: number };

/**
 * 대회 관심 등록 상태 (#335).
 *
 * 서버가 그린 값(props) 위에 이 화면에서 누른 결과를 덮어 쓴다. 로그인 뒤 서버 렌더가 다시 돌아
 * props가 바뀌어도 덮어 쓴 값은 서버에도 반영된 값이라 어긋나지 않는다.
 * 누르는 순간 먼저 바꿔 보여 주고(낙관적), 실패하면 되돌리고 토스트로 알린다.
 * 응답을 기다리는 대회는 다시 눌러도 무시한다 — 빠르게 두 번 누르면 요청 순서가 꼬일 수 있다.
 *
 * 처음 등록에 성공하면(설정의 관심 대회 알림이 꺼져 있고 아직 물어본 적이 없으면 — 서버 값) 마감 알림을 받을지 시트로 묻는다
 * (#375 · #422) — 감싼 CompetitionAlertProvider가 있을 때.
 */
export function useCompetitionInterest({
  interestedIds,
  interestCounts,
  resetKey,
  today,
}: {
  interestedIds: readonly number[];
  interestCounts: Readonly<Record<number, number>>;
  /**
   * 덮어 쓴 값을 비우는 기준 — 넘기면 서버 값 묶음이 새로 왔을 때(이 값이 바뀔 때)만 비운다.
   * 목록처럼 이어 받은 페이지가 관심 값에 더해지는 화면은, 더해질 때마다 누른 결과가 지워지지 않게 넘긴다.
   * 없으면 interestedIds·interestCounts가 바뀔 때 비운다.
   */
  resetKey?: unknown;
  /**
   * 한국 날짜 "YYYY-MM-DD" — 대회 전체를 받은 관심 기록의 단계(reg_status)를 셀 오늘. 없으면 단계를 싣지 않는다
   * (시계를 여기서 읽으면 이 훅을 든 화면 전체가 분마다 다시 그려진다 — 오늘은 호출부가 넘긴다).
   */
  today?: string;
}): CompetitionInterest {
  const [overrides, setOverrides] = useState<Record<number, Override>>({});
  const pending = useRef(new Set<number>());
  const signedIn = useIsSignedIn();
  const { promptLogin } = useAuth();
  const { guard } = useLoginGuard();
  const toast = useToast();
  const alerts = useCompetitionAlerts();

  // 서버 값이 새로 오거나(로그인 뒤 다시 그림) 로그인 상태가 바뀌면 이 화면에서 덮어 쓴 값을 비운다 —
  // 새 서버 값이 이미 그 결과를 담고 있고, 로그아웃·다른 계정이면 이전 사람의 관심이 남으면 안 된다.
  const [seen, setSeen] = useState({
    interestedIds,
    interestCounts,
    resetKey,
    signedIn,
  });
  const serverChanged =
    resetKey === undefined
      ? seen.interestedIds !== interestedIds ||
        seen.interestCounts !== interestCounts
      : seen.resetKey !== resetKey;
  if (serverChanged || seen.signedIn !== signedIn) {
    setSeen({ interestedIds, interestCounts, resetKey, signedIn });
    setOverrides({});
  }

  const serverInterested = useMemo(
    () => new Set(signedIn ? interestedIds : []),
    [interestedIds, signedIn],
  );

  const isInterested = useCallback(
    (id: number) =>
      signedIn && (overrides[id]?.interested ?? serverInterested.has(id)),
    [overrides, serverInterested, signedIn],
  );

  const countOf = useCallback(
    (id: number) => overrides[id]?.count ?? interestCounts[id] ?? 0,
    [interestCounts, overrides],
  );

  const currentIds = useMemo(() => {
    if (!signedIn) return new Set<number>();
    const ids = new Set(serverInterested);
    for (const [id, override] of Object.entries(overrides)) {
      if (override.interested) ids.add(Number(id));
      else ids.delete(Number(id));
    }
    return ids;
  }, [overrides, serverInterested, signedIn]);

  /**
   * 관심을 next로 바꾼다. 바뀐 결과가 서버에 남았으면 true.
   * analytics를 주면 서버가 받은 뒤에만 관심 기록(GA)을 남긴다 — 실패로 되돌리면 남기지 않는다.
   */
  const run = useCallback(
    async (
      id: number,
      next: boolean,
      analytics?: CompetitionInterestContext,
    ): Promise<boolean> => {
      if (pending.current.has(id)) return false;
      const before: Override = {
        interested: isInterested(id),
        count: countOf(id),
      };
      if (before.interested === next) return true;
      pending.current.add(id);

      setOverrides((current) => ({
        ...current,
        [id]: {
          interested: next,
          count: Math.max(0, before.count + (next ? 1 : -1)),
        },
      }));

      try {
        // 토큰이 만료됐으면 앱 갱신 뒤 한 번 다시 부른다(#524).
        const result = await retryAfterSessionRefresh(() =>
          setCompetitionInterestAction(id, next),
        );
        if (!result.ok && result.reason === "unauthenticated") {
          // 화면은 로그인으로 알았는데 서버 세션이 끝났다 — 다시 눌러도 안 되니 로그인부터 안내한다.
          setOverrides((current) => ({ ...current, [id]: before }));
          promptLogin({ reason: "interest" });
          return false;
        }
        if (!result.ok && result.reason === "not-found") {
          setOverrides((current) => ({ ...current, [id]: before }));
          toast.show(COMPETITION_GONE_MESSAGE, { tone: "info" });
          return false;
        }
        if (!result.ok) throw new Error(result.reason);
        setOverrides((current) => ({
          ...current,
          [id]: { interested: result.interested, count: result.interestCount },
        }));
        if (analytics) {
          trackCompetitionInterest(
            id,
            result.interested,
            analytics.from,
            analytics.regStatus,
          );
        }
        return true;
      } catch {
        setOverrides((current) => ({ ...current, [id]: before }));
        toast.show(
          next
            ? "관심 등록하지 못했어요. 다시 눌러 주세요"
            : "관심 해제하지 못했어요. 다시 눌러 주세요",
          { tone: "error" },
        );
        return false;
      } finally {
        pending.current.delete(id);
      }
    },
    [countOf, isInterested, promptLogin, toast],
  );

  const toggle = useCallback(
    (
      target: CompetitionAlertTarget | Competition,
      context: CompetitionInterestContext,
    ) => {
      const regStatus =
        context.regStatus ??
        (today && "status" in target
          ? regStatusOf(detailStatusOn(target, today))
          : undefined);
      const action = async () => {
        const next = !isInterested(target.id);
        if (
          (await run(target.id, next, { from: context.from, regStatus })) &&
          next
        ) {
          alerts?.askOnFirstInterest(target);
        }
      };
      if (signedIn) void action();
      else
        guard(
          () => void action(),
          "interest",
          "관심 등록은 OSS 앱에서 로그인 후 할 수 있어요.",
        )();
    },
    [alerts, guard, isInterested, run, signedIn, today],
  );

  const register = useCallback(
    (target: CompetitionAlertTarget) => run(target.id, true),
    [run],
  );

  const apply = useCallback(
    (id: number, interested: boolean, count: number) =>
      setOverrides((current) => ({ ...current, [id]: { interested, count } })),
    [],
  );

  return {
    interestedIds: currentIds,
    isInterested,
    countOf,
    toggle,
    register,
    apply,
  };
}
