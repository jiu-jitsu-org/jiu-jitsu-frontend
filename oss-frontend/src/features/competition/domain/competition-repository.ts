import type { Competition } from "@/features/competition/domain/competition";

export interface CompetitionRepository {
  getCompetitions(): Promise<Competition[]>;
}
