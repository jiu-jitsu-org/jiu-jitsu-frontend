import type {
  CompetitionListQuery,
  CompetitionPage,
} from "@/features/competition/domain/competition";
import type { CompetitionRepository } from "@/features/competition/domain/competition-repository";

/** 대회 목록 한 페이지 조회. 로그인 없이도 볼 수 있다(관심만 보기는 로그인 필요). */
export class GetCompetitionListUseCase {
  constructor(private readonly competitionRepository: CompetitionRepository) {}

  execute(query: CompetitionListQuery): Promise<CompetitionPage> {
    return this.competitionRepository.getCompetitions(query);
  }
}
