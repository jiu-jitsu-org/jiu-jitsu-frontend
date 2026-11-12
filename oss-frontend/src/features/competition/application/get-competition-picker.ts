import type {
  CompetitionPickerPage,
  CompetitionRepository,
} from "@/features/competition/domain/competition-repository";

/** 글쓰기에서 고를 수 있는 대회(#367) — 다가오는 대회 → 끝난 대회, 최대 20개. 이름 검색어를 함께 보낼 수 있다. */
export class GetCompetitionPickerUseCase {
  constructor(private readonly competitionRepository: CompetitionRepository) {}

  execute(keyword?: string): Promise<CompetitionPickerPage> {
    return this.competitionRepository.getPickerCompetitions(keyword);
  }
}
