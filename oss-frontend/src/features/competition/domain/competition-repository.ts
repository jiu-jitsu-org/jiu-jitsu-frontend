import type { Competition } from "@/features/competition/domain/competition";

export interface CompetitionRepository {
  getCompetitions(): Promise<Competition[]>;
  /** 대회 하나 — 없는 id면 null(#361). */
  getCompetition(id: string): Promise<Competition | null>;
}
