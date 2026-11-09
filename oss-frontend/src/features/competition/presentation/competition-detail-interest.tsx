"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import {
  useCompetitionInterest,
  type CompetitionInterest,
} from "@/features/competition/presentation/use-competition-interest";

const CompetitionDetailInterestContext =
  createContext<CompetitionInterest | null>(null);

/**
 * 대회 상세의 관심 상태를 머리(알림 종, #376)와 맨 위 요약(관심 버튼, #362)이 함께 쓴다.
 * 종으로 알림을 켜면 관심도 함께 등록되므로, 둘이 같은 값을 봐야 관심 버튼이 바로 따라 바뀐다.
 */
export function CompetitionDetailInterestProvider({
  competitionId,
  interested,
  interestCount,
  children,
}: {
  competitionId: string;
  interested: boolean;
  interestCount: number;
  children: ReactNode;
}) {
  // 훅은 서버 값이 "바뀌었는지"를 참조로 본다 — 매번 새 배열을 넘기면 바뀐 것으로 알고 끝없이 다시 그린다.
  const interestedIds = useMemo(
    () => (interested ? [competitionId] : []),
    [competitionId, interested],
  );
  const interestCounts = useMemo(
    () => ({ [competitionId]: interestCount }),
    [competitionId, interestCount],
  );
  const interest = useCompetitionInterest({ interestedIds, interestCounts });
  return (
    <CompetitionDetailInterestContext.Provider value={interest}>
      {children}
    </CompetitionDetailInterestContext.Provider>
  );
}

export function useCompetitionDetailInterest(): CompetitionInterest {
  const interest = useContext(CompetitionDetailInterestContext);
  if (!interest) {
    throw new Error("CompetitionDetailInterestProvider 안에서만 쓴다");
  }
  return interest;
}
