"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import {
  useAuth,
  useIsSignedIn,
} from "@/features/auth/presentation/auth-provider";
import { useLoginGuard } from "@/features/community/presentation/use-login-guard";
import { setCompetitionInterestAction } from "@/features/competition/presentation/actions/set-competition-interest-action";
import { useCompetitionAlerts } from "@/features/competition/presentation/competition-alert-provider";
import type { CompetitionAlertTarget } from "@/features/competition/presentation/competition-alert-sheet";
import { useToast } from "@/shared/ui";

export type CompetitionInterest = {
  /** 지금 내가 관심 등록한 대회 id (누르는 즉시 반영된 값). */
  interestedIds: ReadonlySet<string>;
  isInterested: (competitionId: string) => boolean;
  countOf: (competitionId: string) => number;
  /**
   * 관심 등록·해제. 비로그인이면 로그인 안내(외부 브라우저면 앱 안내)만 띄운다.
   * 대회 이름·접수 일정을 함께 받는 것은 첫 등록 때 마감 알림 시트(#375)가 이 대회의 알림 날을 보여 주기 때문이다.
   */
  toggle: (target: CompetitionAlertTarget) => void;
  /** 관심 등록만(이미 등록돼 있으면 그대로). 시트는 띄우지 않는다 — 대회 상세의 알림 켜기(#376)가 쓴다. 성공 여부를 돌려준다. */
  register: (target: CompetitionAlertTarget) => Promise<boolean>;
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
 * 이 기기에서 처음 등록에 성공하면 마감 알림을 받을지 시트로 묻는다(#375) — 감싼 CompetitionAlertProvider가 있을 때.
 */
export function useCompetitionInterest({
  interestedIds,
  interestCounts,
}: {
  interestedIds: readonly string[];
  interestCounts: Readonly<Record<string, number>>;
}): CompetitionInterest {
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const pending = useRef(new Set<string>());
  const signedIn = useIsSignedIn();
  const { promptLogin } = useAuth();
  const { guard } = useLoginGuard();
  const toast = useToast();
  const alerts = useCompetitionAlerts();

  // 서버 값이 새로 오거나(로그인 뒤 다시 그림) 로그인 상태가 바뀌면 이 화면에서 덮어 쓴 값을 비운다 —
  // 새 서버 값이 이미 그 결과를 담고 있고, 로그아웃·다른 계정이면 이전 사람의 관심이 남으면 안 된다.
  const [seen, setSeen] = useState({ interestedIds, interestCounts, signedIn });
  if (
    seen.interestedIds !== interestedIds ||
    seen.interestCounts !== interestCounts ||
    seen.signedIn !== signedIn
  ) {
    setSeen({ interestedIds, interestCounts, signedIn });
    setOverrides({});
  }

  const serverInterested = useMemo(
    () => new Set(signedIn ? interestedIds : []),
    [interestedIds, signedIn],
  );

  const isInterested = useCallback(
    (id: string) =>
      signedIn && (overrides[id]?.interested ?? serverInterested.has(id)),
    [overrides, serverInterested, signedIn],
  );

  const countOf = useCallback(
    (id: string) => overrides[id]?.count ?? interestCounts[id] ?? 0,
    [interestCounts, overrides],
  );

  const currentIds = useMemo(() => {
    if (!signedIn) return new Set<string>();
    const ids = new Set(serverInterested);
    for (const [id, override] of Object.entries(overrides)) {
      if (override.interested) ids.add(id);
      else ids.delete(id);
    }
    return ids;
  }, [overrides, serverInterested, signedIn]);

  /** 관심을 next로 바꾼다. 바뀐 결과가 서버에 남았으면 true. */
  const run = useCallback(
    async (id: string, next: boolean): Promise<boolean> => {
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
        const result = await setCompetitionInterestAction(id, next);
        if (!result.ok && result.reason === "unauthenticated") {
          // 화면은 로그인으로 알았는데 서버 세션이 끝났다 — 다시 눌러도 안 되니 로그인부터 안내한다.
          setOverrides((current) => ({ ...current, [id]: before }));
          promptLogin({ reason: "대회 관심 등록" });
          return false;
        }
        if (!result.ok) throw new Error(result.reason);
        setOverrides((current) => ({
          ...current,
          [id]: { interested: next, count: result.count },
        }));
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
    (target: CompetitionAlertTarget) => {
      const action = async () => {
        const next = !isInterested(target.id);
        if ((await run(target.id, next)) && next) {
          alerts?.askOnFirstInterest(target);
        }
      };
      if (signedIn) void action();
      else
        guard(
          () => void action(),
          "관심 등록은 OSS 앱에서 로그인 후 할 수 있어요.",
        )();
    },
    [alerts, guard, isInterested, run, signedIn],
  );

  const register = useCallback(
    (target: CompetitionAlertTarget) => run(target.id, true),
    [run],
  );

  return { interestedIds: currentIds, isInterested, countOf, toggle, register };
}
