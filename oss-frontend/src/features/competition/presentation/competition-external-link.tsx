"use client";

import type { ComponentProps } from "react";

import type { CompetitionDetailStatus } from "@/features/competition/domain/competition-schedule";
import {
  regStatusOf,
  trackCompetitionLinkClick,
  useRememberDetailEntry,
  type CompetitionLinkType,
} from "@/features/competition/presentation/competition-analytics";

/**
 * 대회 상세의 바깥 링크(새 창) — 누르면 `competition_link_click`을 남기고 그대로 연다(GA, #620).
 * 기록이 실패해도 링크 열기는 막지 않는다(기본 동작을 건드리지 않는다). 서버가 그리는 바닥 바도 쓰게 따로 둔다.
 */
export function CompetitionExternalLink({
  competitionId,
  linkType,
  status,
  onClick,
  ...props
}: Omit<ComponentProps<"a">, "target" | "rel"> & {
  competitionId: number;
  linkType: CompetitionLinkType;
  /** 그 순간 상세가 보여 주는 단계 — 기록의 reg_status. */
  status: CompetitionDetailStatus | null;
}) {
  useRememberDetailEntry(competitionId);
  return (
    <a
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => {
        trackCompetitionLinkClick(competitionId, linkType, regStatusOf(status));
        onClick?.(event);
      }}
    />
  );
}
