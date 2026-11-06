"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { useIsSignedIn } from "@/features/auth/presentation/auth-provider";
import { useLoginGuard } from "@/features/community/presentation/use-login-guard";
import { setCompetitionInterestAction } from "@/features/competition/presentation/actions/set-competition-interest-action";
import { notifyCompetitionInterestFirstAdded } from "@/shared/lib/native-bridge";
import { useToast } from "@/shared/ui";

/** 이 기기에서 관심 등록을 한 번이라도 했는지 — 첫 등록 안내·알림 권한 신호를 한 번만 내려고 둔다. */
const FIRST_INTEREST_KEY = "oss.competition.interest.onboarded";

export type CompetitionInterest = {
  /** 지금 내가 관심 등록한 대회 id (누르는 즉시 반영된 값). */
  interestedIds: ReadonlySet<string>;
  isInterested: (competitionId: string) => boolean;
  countOf: (competitionId: string) => number;
  /** 관심 등록·해제. 비로그인이면 로그인 안내(외부 브라우저면 앱 안내)만 띄운다. */
  toggle: (competitionId: string) => void;
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
 * 처음 등록에 성공하면 "마감 전에 알려 드려요"를 한 번 띄우고, 앱에 알림 권한을 물으라고 알린다.
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
  const { guard } = useLoginGuard();
  const toast = useToast();

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

  const run = useCallback(
    async (id: string) => {
      if (pending.current.has(id)) return;
      pending.current.add(id);

      const before: Override = { interested: isInterested(id), count: countOf(id) };
      const next = !before.interested;
      setOverrides((current) => ({
        ...current,
        [id]: { interested: next, count: Math.max(0, before.count + (next ? 1 : -1)) },
      }));

      try {
        const result = await setCompetitionInterestAction(id, next);
        if (!result.ok) throw new Error(result.reason);
        setOverrides((current) => ({
          ...current,
          [id]: { interested: next, count: result.count },
        }));
        if (next && markFirstInterest()) {
          toast.show("관심 대회로 등록했어요. 마감 전에 알려 드려요", {
            tone: "success",
          });
          notifyCompetitionInterestFirstAdded({ competitionId: id });
        }
      } catch {
        setOverrides((current) => ({ ...current, [id]: before }));
        toast.show(
          next ? "관심 등록하지 못했어요. 다시 눌러 주세요" : "관심 해제하지 못했어요. 다시 눌러 주세요",
          { tone: "error" },
        );
      } finally {
        pending.current.delete(id);
      }
    },
    [countOf, isInterested, toast],
  );

  const toggle = useCallback(
    (id: string) => {
      const action = () => void run(id);
      if (signedIn) action();
      else guard(action, "관심 등록은 OSS 앱에서 로그인 후 할 수 있어요.")();
    },
    [guard, run, signedIn],
  );

  return { interestedIds: currentIds, isInterested, countOf, toggle };
}

/**
 * 첫 관심 등록이면 표시를 남기고 true. 저장소를 못 쓰는 환경(사생활 보호 모드)이면 매번 false —
 * 안내가 매번 뜨는 것보다 안 뜨는 편이 낫다.
 */
function markFirstInterest(): boolean {
  try {
    if (window.localStorage.getItem(FIRST_INTEREST_KEY)) return false;
    window.localStorage.setItem(FIRST_INTEREST_KEY, "1");
    return true;
  } catch {
    return false;
  }
}
